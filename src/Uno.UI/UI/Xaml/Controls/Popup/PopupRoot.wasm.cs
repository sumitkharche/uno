﻿using System;
using System.Collections.Generic;
using System.Linq;
using Windows.Foundation;
using Windows.UI.Xaml.Media;

namespace Windows.UI.Xaml.Controls
{
	internal partial class PopupRoot : Panel
	{
		public PopupRoot()
		{
			Background = new SolidColorBrush(Colors.Transparent);
			UpdateLightDismissArea();
		}

		protected override void OnChildrenChanged()
		{
			base.OnChildrenChanged();
			UpdateLightDismissArea();
		}

		internal void UpdateLightDismissArea()
		{
			var anyDismissableChild = Children
				.OfType<PopupPanel>()
				.Any(pp => pp.Popup.IsLightDismissEnabled);

			Background = anyDismissableChild
				? new SolidColorBrush(Colors.Transparent)
				: null;
		}

		protected override Size ArrangeOverride(Size finalSize)
		{
			foreach (var child in Children)
			{
				if (!(child is PopupPanel panel))
				{
					continue;
				}

				// Note: The popup alignment is ensure by the PopupPanel itself
				child.Arrange(new Rect(new Point(), finalSize));
			}

			return finalSize;
		}
	}
}
