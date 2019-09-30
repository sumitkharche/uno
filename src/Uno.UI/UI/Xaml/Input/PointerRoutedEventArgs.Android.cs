﻿using System;
using System.Collections.Generic;
using System.Text;
using Windows.Devices.Input;
using Android.Views;
using Uno.UI;
using Windows.Foundation;
using Windows.System;
using Windows.UI.Input;
using Windows.UI.Xaml.Extensions;
using Uno.Extensions;

namespace Windows.UI.Xaml.Input
{
	partial class PointerRoutedEventArgs
	{
		private readonly MotionEvent _nativeEvent;
		private readonly UIElement _receiver;

		/// <summary>
		/// DO NOT USE - LEGACY SUPPORT - Will be removed soon
		/// Used by the native ButtonBase to simulate the PointerEvents.
		/// Needs to be reworked to include all expected properties of a PointerEventArgs, and to ensure the right sequence.
		/// </summary>
		internal PointerRoutedEventArgs(UIElement receiver) : this()
		{
			Pointer = new Pointer(0, PointerDeviceType.Touch, true, isInRange: true);
			KeyModifiers = VirtualKeyModifiers.None;
			OriginalSource = receiver;
			CanBubbleNatively = true;
		}

		internal PointerRoutedEventArgs(MotionEvent nativeEvent, UIElement originalSource, UIElement receiver) : this()
		{
			_nativeEvent = nativeEvent;
			_receiver = receiver;

			var pointerId = (uint)nativeEvent.DeviceId; // The nativeEvent.GetPointerId(**) almost always returns 0
			var type = nativeEvent.GetToolType(nativeEvent.ActionIndex).ToPointerDeviceType();
			var isInContact = nativeEvent.Action.HasFlag(MotionEventActions.Down)
				|| nativeEvent.Action.HasFlag(MotionEventActions.PointerDown)
				|| nativeEvent.Action.HasFlag(MotionEventActions.Move);
			var keys = nativeEvent.MetaState.ToVirtualKeyModifiers();

			FrameId = (uint)_nativeEvent.EventTime;
			Pointer = new Pointer(pointerId, type, isInContact, isInRange: true);
			KeyModifiers = keys;
			OriginalSource = originalSource;
			CanBubbleNatively = true;
		}

		public PointerPoint GetCurrentPoint(UIElement relativeTo)
		{
			var timestamp = ToTimeStamp(_nativeEvent.EventTime);
			var device = PointerDevice.For(Pointer.PointerDeviceType);
			var rawPosition = new Point(_nativeEvent.RawX, _nativeEvent.RawY); // Relative to the screen
			var position = GetPosition(relativeTo);
			var properties = GetProperties();

			return new PointerPoint(FrameId, timestamp, device, Pointer.PointerId, rawPosition, position, Pointer.IsInContact, properties);
		}

		private Point GetPosition(UIElement relativeTo)
		{
			float x, y, xOrigin, yOrigin;
			if (relativeTo == null) // Relative to the window
			{
				var viewCoords = new int[2];
				_receiver.GetLocationInWindow(viewCoords);

				x = _nativeEvent.GetX(_nativeEvent.ActionIndex) + viewCoords[0];
				y = _nativeEvent.GetY(_nativeEvent.ActionIndex) + viewCoords[1];
				xOrigin = 0;
				yOrigin = 0;
			}
			else if (relativeTo == _receiver) // Fast path
			{
				x = _nativeEvent.GetX(_nativeEvent.ActionIndex);
				y = _nativeEvent.GetY(_nativeEvent.ActionIndex);
				xOrigin = 0;
				yOrigin = 0;
			}
			else
			{
				var viewCoords = new int[2];
				relativeTo.GetLocationOnScreen(viewCoords);

				// Note: _nativeEvent.RawX/Y are relative to the screen, not the window
				x = _nativeEvent.RawX;
				y = _nativeEvent.RawY;
				xOrigin = viewCoords[0];
				yOrigin = viewCoords[1];
			}

			var physicalPoint = new Point(x - xOrigin, y - yOrigin);
			var logicalPoint = physicalPoint.PhysicalToLogicalPixels();

			return logicalPoint;
		}

		private PointerPointProperties GetProperties()
		{
			var props = new PointerPointProperties
			{
				IsPrimary = true,
				IsInRange = Pointer.IsInRange
			};

			var type = _nativeEvent.GetToolType(_nativeEvent.ActionIndex);
			var action = _nativeEvent.Action;
			var isDown = action.HasFlag(MotionEventActions.Down) || action.HasFlag(MotionEventActions.PointerDown);
			var isUp = action.HasFlag(MotionEventActions.Up) || action.HasFlag(MotionEventActions.PointerUp);
			var updates = _none;
			switch (type)
			{
				case MotionEventToolType.Finger:
					props.IsLeftButtonPressed = Pointer.IsInContact;
					updates = isDown ? _fingerDownUpdates : isUp ? _fingerUpUpdates : _none;
					break;
				case MotionEventToolType.Mouse:
					props.IsLeftButtonPressed = _nativeEvent.IsButtonPressed(MotionEventButtonState.Primary);
					props.IsMiddleButtonPressed = _nativeEvent.IsButtonPressed(MotionEventButtonState.Tertiary);
					props.IsRightButtonPressed = _nativeEvent.IsButtonPressed(MotionEventButtonState.Secondary);
					updates = isDown ? _mouseDownUpdates : isUp ? _mouseUpUpdates : _none;
					break;
				case MotionEventToolType.Stylus:
					props.IsBarrelButtonPressed = _nativeEvent.IsButtonPressed(MotionEventButtonState.StylusPrimary);
					props.IsLeftButtonPressed = !props.IsBarrelButtonPressed;
					break;
				case MotionEventToolType.Eraser:
					props.IsEraser = true;
					break;
				case MotionEventToolType.Unknown: // used by Xamarin.UITest
				default:
					break;
			}

			if (updates.TryGetValue(_nativeEvent.ActionButton, out var update))
			{
				props.PointerUpdateKind = update;
			}

			return props;
		}

		#region Misc static helpers
		private static readonly Dictionary<MotionEventButtonState, PointerUpdateKind> _none = new Dictionary<MotionEventButtonState, PointerUpdateKind>(0);
		private static readonly Dictionary<MotionEventButtonState, PointerUpdateKind> _fingerDownUpdates = new Dictionary<MotionEventButtonState, PointerUpdateKind>
		{
			{ MotionEventButtonState.Primary, PointerUpdateKind.LeftButtonPressed }
		};
		private static readonly Dictionary<MotionEventButtonState, PointerUpdateKind> _fingerUpUpdates = new Dictionary<MotionEventButtonState, PointerUpdateKind>
		{
			{ MotionEventButtonState.Primary, PointerUpdateKind.LeftButtonReleased }
		};
		private static readonly Dictionary<MotionEventButtonState, PointerUpdateKind> _mouseDownUpdates = new Dictionary<MotionEventButtonState, PointerUpdateKind>
		{
			{ MotionEventButtonState.Primary, PointerUpdateKind.LeftButtonPressed },
			{ MotionEventButtonState.Tertiary, PointerUpdateKind.MiddleButtonPressed },
			{ MotionEventButtonState.Secondary, PointerUpdateKind.RightButtonPressed }
		};
		private static readonly Dictionary<MotionEventButtonState, PointerUpdateKind> _mouseUpUpdates = new Dictionary<MotionEventButtonState, PointerUpdateKind>
		{
			{ MotionEventButtonState.Primary, PointerUpdateKind.LeftButtonReleased },
			{ MotionEventButtonState.Tertiary, PointerUpdateKind.MiddleButtonReleased },
			{ MotionEventButtonState.Secondary, PointerUpdateKind.RightButtonReleased }
		};

		private static readonly ulong _unixEpochMs = (ulong)(new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc) - new DateTime()).TotalMilliseconds;

		private static ulong ToTimeStamp(long uptimeMillis)
		{
			if (FeatureConfiguration.PointerRoutedEventArgs.AllowRelativeTimeStamp)
			{
				return (ulong)(TimeSpan.TicksPerMillisecond * uptimeMillis);
			}
			else
			{
				// We cannot cache the "bootTime" as the "uptimeMillis" is frozen while in deep sleep
				// (cf. https://developer.android.com/reference/android/os/SystemClock)

				var sleepTime = Android.OS.SystemClock.ElapsedRealtime() - Android.OS.SystemClock.UptimeMillis();
				var realUptime = (ulong)(uptimeMillis + sleepTime);
				var timestamp = TimeSpan.TicksPerMillisecond * (_unixEpochMs + realUptime);

				return timestamp;
			}
		}
		#endregion
	}
}
