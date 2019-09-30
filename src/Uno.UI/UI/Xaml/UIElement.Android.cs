﻿using Uno.UI;
using Uno.UI.Controls;
using Uno.UI.Xaml.Input;
using System;
using System.Collections.Generic;
using System.Linq;
using Windows.Foundation;
using Android.Support.V4.View;
using Windows.UI.Xaml.Media;
using Android.Views;

namespace Windows.UI.Xaml
{
	public partial class UIElement : BindableView
	{
		public UIElement()
			: base(ContextHelper.Current)
		{
			InitializePointers();
		}

		partial void EnsureClip(Rect rect)
		{
			if (rect.IsEmpty)
			{
				ViewCompat.SetClipBounds(this, null);
				return;
			}

			ViewCompat.SetClipBounds(this, rect.LogicalToPhysicalPixels());
		}

		private bool _renderTransformRegisteredParentChanged;
		private static void RenderTransformOnParentChanged(object dependencyObject, object _, DependencyObjectParentChangedEventArgs args)
			=> ((UIElement)dependencyObject)._renderTransform?.UpdateParent(args.PreviousParent, args.NewParent);
		partial void OnRenderTransformSet()
		{
			// On first Transform set, we register to the parent changed, so we can enable or disable the static transformations on it
			if (!_renderTransformRegisteredParentChanged)
			{
				((IDependencyObjectStoreProvider)this).Store.RegisterSelfParentChangedCallback(RenderTransformOnParentChanged);
				_renderTransformRegisteredParentChanged = true;
			}
		}

		public GeneralTransform TransformToVisual(UIElement visual)
		{
			return TransformToVisual(this, visual);
		}

		internal static GeneralTransform TransformToVisual(View element, View visual)
		{
			var thisRect = new int[2];
			var otherRect = new int[2];
			element.GetLocationOnScreen(thisRect);

			// If visual is null, we transform the element to the window
			if (visual == null)
			{
				// Do nothing (leave at 0,0)
			}
			else
			{
				visual.GetLocationOnScreen(otherRect);
			}

			var x = thisRect[0] - otherRect[0];
			var y = thisRect[1] - otherRect[1];

			return new MatrixTransform
			{
				Matrix = new Matrix(
					m11: 1,
					m12: 0,
					m21: 0,
					m22: 1,
					offsetX: ViewHelper.PhysicalToLogicalPixels(x),
					offsetY: ViewHelper.PhysicalToLogicalPixels(y)
				)
			};
		}

		protected virtual void OnVisibilityChanged(Visibility oldValue, Visibility newValue)
		{
			var newNativeVisibility = newValue == Visibility.Visible ? Android.Views.ViewStates.Visible : Android.Views.ViewStates.Gone;

			var bindableView = ((object)this) as Uno.UI.Controls.BindableView;

			if (bindableView != null)
			{
				// This cast is different for performance reasons. See the 
				// UnoViewGroup java class for more details.
				bindableView.Visibility = newNativeVisibility;
				bindableView.RequestLayout();
			}
			else
			{
				((View)this).Visibility = newNativeVisibility;
				((View)this).RequestLayout();
			}
		}

		partial void OnOpacityChanged(DependencyPropertyChangedEventArgs args)
		{
			Alpha = IsRenderingSuspended ? 0 : (float)Opacity;
		}

		internal Windows.Foundation.Point GetPosition(Point position, global::Windows.UI.Xaml.UIElement relativeTo)
		{
			var currentViewLocation = new int[2];
			GetLocationInWindow(currentViewLocation);

			var relativeToLocation = new int[2];
			GetLocationInWindow(relativeToLocation);

			return new Point(
				currentViewLocation[0] - relativeToLocation[0],
				currentViewLocation[1] - relativeToLocation[1]
			);
		}

		/// <summary>
		/// Provides a native value for the dependency property with the given name on the current instance. If the value is a primitive type, 
		/// its native representation is returned. Otherwise, the <see cref="object.ToString"/> implementation is used/returned instead.
		/// </summary>
		/// <param name="dependencyPropertyName">The name of the target dependency property</param>
		/// <returns>The content of the target dependency property (its actual value if it is a primitive type ot its <see cref="object.ToString"/> representation otherwise</returns>
		[Java.Interop.Export(nameof(GetDependencyPropertyValue))]
		public Java.Lang.Object GetDependencyPropertyValue(string dependencyPropertyName)
		{
			var dpValue = GetDependencyPropertyValueInternal(this, dependencyPropertyName);
			if (dpValue == null)
			{
				return null;
			}

			var jObject = dpValue as Java.Lang.Object;
			if (jObject != null)
			{
				return jObject;
			}

			var type = dpValue.GetType();
			if (type == typeof(bool))
			{
				return new Java.Lang.Boolean((bool)dpValue);
			}
			else if (type == typeof(sbyte))
			{
				return new Java.Lang.Byte((sbyte)dpValue);
			}
			else if (type == typeof(char))
			{
				return new Java.Lang.Character((char)dpValue);
			}
			else if (type == typeof(short))
			{
				return new Java.Lang.Short((short)dpValue);
			}
			else if (type == typeof(int))
			{
				return new Java.Lang.Integer((int)dpValue);
			}
			else if (type == typeof(long))
			{
				return new Java.Lang.Long((long)dpValue);
			}
			else if (type == typeof(float))
			{
				return new Java.Lang.Float((float)dpValue);
			}
			else if (type == typeof(double))
			{
				return new Java.Lang.Double((double)dpValue);
			}
			else if (type == typeof(string))
			{
				return new Java.Lang.String((string)dpValue);
			}

			// If all else fails, just return the string representation of the DP's value
			return new Java.Lang.String(dpValue.ToString());
		}

#if DEBUG
		public static Predicate<View> ViewOfInterestSelector { get; set; } = v => (v as FrameworkElement)?.Name == "TargetView";

		public bool IsViewOfInterest => ViewOfInterestSelector(this);

		/// <summary>
		/// Returns the first view matching <see cref="ViewOfInterestSelector"/> anywhere in the visual tree. Handy when debugging Uno.
		/// </summary>
		/// <remarks>This property is intended as a shortcut to inspect the properties of a specific view at runtime. Suggested usage: 
		/// 1. Be debugging Uno. 2. Flag the view you want in xaml with 'Name = "TargetView", or set <see cref="ViewOfInterestSelector"/> 
		/// to select the view you want. 3. Put a breakpoint in the <see cref="UIElement.NativeHitCheck"/> method. 4. Tap anywhere in the app. 
		/// 5. Inspect this property, or one of the typed versions below.</remarks>
		public View ViewOfInterest
		{
			get
			{
				ViewGroup topLevel = this;
				while (topLevel.Parent is ViewGroup newTopLevel)
				{
					topLevel = newTopLevel;
				}

				return GetMatchInChildren(topLevel);

				View GetMatchInChildren(ViewGroup parent)
				{
					if (parent == null)
					{
						return null;
					}

					for (int i = 0; i < parent.ChildCount; i++)
					{
						var child = parent.GetChildAt(i);
						if (ViewOfInterestSelector(child))
						{
							return child;
						}

						var inChild = GetMatchInChildren(child as ViewGroup);

						if (inChild != null)
						{
							return inChild;
						}
					}

					return null;
				}
			}
		}

		// Typed properties for easier inspection

		public Controls.ContentControl ContentControlOfInterest => ViewOfInterest as Controls.ContentControl;

		public Controls.Panel PanelOfInterest => ViewOfInterest as Controls.Panel;

		public FrameworkElement FrameworkElementOfInterest => ViewOfInterest as FrameworkElement;

		public string ShowDescendants() => ViewExtensions.ShowDescendants(this);
		public string ShowLocalVisualTree(int fromHeight) => ViewExtensions.ShowLocalVisualTree(this, fromHeight);
#endif
	}
}
