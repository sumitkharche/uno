﻿using NUnit.Framework;
using SamplesApp.UITests.TestFramework;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Uno.UITest.Helpers;
using Uno.UITest.Helpers.Queries;

namespace SamplesApp.UITests.Windows_UI_Xaml_Controls.FocusManagerTests
{
	[ActivePlatforms(Platform.iOS, Platform.Browser)]	// Ignore focus tests for android, focus is getting stolen incorrectly 
	[TestFixture]
	public partial class FocusManagerTests_Tests : SampleControlUITestBase
	{
		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_Border_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var frameworkElement = _app.Marked("MyBorder");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - Border - 1 - Inital State");

			frameworkElement.Tap();

			// Assert After Selection 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - Border - 2 - After Selection");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_Button_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var frameworkElement = _app.Marked("MyButton");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - Button - 1 - Inital State");

			frameworkElement.Tap();
			_app.Wait(2);

			// Assert After Selection 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "MyButton");
			_app.Screenshot("FocusManager - GetFocusedElement - Button - 2 - After Selection");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_Button_LostFocus_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var frameworkElement = _app.Marked("MyButton");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - LostFocus - Button - 1 - Inital State");

			frameworkElement.Tap();
			_app.Wait(1);

			_app.TapCoordinates(20, 100);

			// Assert Click outside
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - LostFocus - Button - 2 - Click outside");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_CheckBox_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var frameworkElement = _app.Marked("MyCheckBox");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - CheckBox - 1 - Inital State");

			frameworkElement.Tap();
			_app.Wait(2);

			// Assert After Selection 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "MyCheckBox");
			_app.Screenshot("FocusManager - GetFocusedElement - CheckBox - 2 - After Selection");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_CheckBox_LostFocus_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var frameworkElement = _app.Marked("MyCheckBox");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");;
			_app.Screenshot("FocusManager - LostFocus - CheckBox - 1 - Inital State");

			frameworkElement.Tap();
			_app.Wait(1);

			_app.TapCoordinates(20, 100);

			// Assert Click outside
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - LostFocus - CheckBox - 3 - Click outside");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_Grid_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var frameworkElement = _app.Marked("MyGrid");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - Grid - 1 - Inital State");

			frameworkElement.Tap();

			// Assert After Selection 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - Grid - 2 - After Selection");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_HyperlinkButton_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var frameworkElement = _app.Marked("MyHyperlinkButton");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - HyperlinkButton - 1 - Inital State");

			frameworkElement.Tap();
			_app.Wait(2);

			_app.TapCoordinates(20, 100);

			// Assert Click outside
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - HyperlinkButton - 2 - Click outside");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_HyperlinkButton_LostFocus_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var frameworkElement = _app.Marked("MyHyperlinkButton");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - LostFocus - HyperlinkButton - 1 - Inital State");

			frameworkElement.Tap();
			_app.Wait(2);

			_app.TapCoordinates(20, 100);

			// Assert Click outside
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - LostFocus - HyperlinkButton - 2 - Click outside");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_Image_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var frameworkElement = _app.Marked("MyImage");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - Image - 1 - Inital State");

			frameworkElement.Tap();

			// Assert After Selection 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - Image - 2 - After Selection");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_Rectangle_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var frameworkElement = _app.Marked("MyRectangle");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - Rectangle - 1 - Inital State");

			frameworkElement.Tap();

			// Assert After Selection 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - Rectangle - 2 - After Selection");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_TextBlock_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var frameworkElement = _app.Marked("MyTextBlock");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - TextBlock - 1 - Inital State");

			frameworkElement.Tap();

			// Assert After Selection 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - TextBlock - 2 - After Selection");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_TextBoxMultiLine_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var frameworkElement = _app.Marked("TextBoxMultiLine");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - TextBoxMultiLine - 1 - Inital State");

			frameworkElement.Tap();
			_app.Wait(2);

			// Assert After Selection 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "TextBoxMultiLine");
			_app.Screenshot("FocusManager - GetFocusedElement - TextBoxMultiLine - 2 - After Selection");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_TextBoxMultiLine_LostFocus_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var frameworkElement = _app.Marked("TextBoxMultiLine");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - LostFocus - TextBoxMultiLine - 1 - Inital State");

			frameworkElement.Tap();
			_app.Wait(1);

			_app.TapCoordinates(20, 100);

			// Assert Click outside
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - LostFocus - TextBoxMultiLine - 2 - Click outside");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_TextBoxSingleLine_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var frameworkElement = _app.Marked("TextBoxSingleLine");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - TextBoxSingleLine - 1 - Inital State");

			frameworkElement.Tap();

			// Assert After Selection 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "TextBoxSingleLine");
			_app.Screenshot("FocusManager - GetFocusedElement - TextBoxSingleLine - 2 - After Selection");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_TextBoxSingleLine_LostFocus_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var frameworkElement = _app.Marked("TextBoxSingleLine");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - LostFocus - TextBoxSingleLine - 1 - Inital State");

			frameworkElement.Tap();
			_app.Wait(2);

			_app.TapCoordinates(20, 100);
			_app.Wait(2);

			// Assert Click outside
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - LostFocus - TextBoxSingleLine - 2 - Click outside");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_ToggleButton_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var frameworkElement = _app.Marked("MyToggleButton");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - ToggleButton - 1 - Inital State");

			frameworkElement.Tap();

			// Assert After Selection 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "MyToggleButton");
			_app.Screenshot("FocusManager - GetFocusedElement - ToggleButton - 2 - After Selection");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_ToggleButton_LostFocus_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var frameworkElement = _app.Marked("MyToggleButton");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - LostFocus - ToggleButton - 1 - Inital State");

			frameworkElement.Tap();
			_app.Wait(1);

			_app.TapCoordinates(20, 100);

			// Assert Click outside
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - LostFocus - ToggleButton - 2 - Click outside");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_ComboBox_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var combo = _app.Marked("MyComboBox");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - ComboBox - 1 - Inital State");

			combo.Tap();
			_app.Wait(2);

			// Assert After Selection 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "MyComboBox");
			_app.Screenshot("FocusManager - GetFocusedElement - ComboBox - 2 - After Selection");

			// Close the combo to not pollute other tests
			_app.TapCoordinates(20, 100);
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_ComboBox_LostFocus_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var combo = _app.Marked("MyComboBox");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - LostFocus - ComboBox - 1 - Inital State");

			combo.Tap();
			_app.Wait(1);

			_app.TapCoordinates(20, 100); // Close the  combo
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "MyComboBox");

			_app.TapCoordinates(20, 100); // Un focus

			// Assert Click outside
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - LostFocus - ComboBox - 2 - Click outside");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_ComboBoxItem_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var comboBox = _app.Marked("MyComboBox");
			var frameworkElement = _app.Marked("MyComboBoxItem_1");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - ComboBoxItem - 1 - Inital State");

			comboBox.Tap();
			_app.Wait(2);

			frameworkElement.Tap();

			// Assert After Selection 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "MyComboBoxItem_1");
			_app.Screenshot("FocusManager - GetFocusedElement - ComboBoxItem - 2 - After Selection");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_ComboBoxItem_LostFocus_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var comboBox = _app.Marked("MyComboBox");
			var item1 = _app.Marked("MyComboBoxItem_1");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - LostFocus - ComboBoxItem - 1 - Inital State");

			comboBox.Tap();
			_app.Wait(1);

			item1.Tap();
			_app.Wait(1);

			_app.TapCoordinates(20, 100);

			// Assert Click outside
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - LostFocus - ComboBoxItem - 2 - Click outside");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_ScrollViewer_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var scrollViewer = _app.Marked("ScrollViewer");
			var frameworkElement = _app.Marked("MyScrollViewerElement");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - ScrollViewer - 1 - Inital State");

			frameworkElement.Tap();

			// Assert After Selection 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - ScrollViewer - 2 - After Selection");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_ListViewItem_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var listView = _app.Marked("MyListView");
			var frameworkElement = _app.Marked("MyListViewItem");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - GetFocusedElement - ListViewItem - 1 - Inital State");

			frameworkElement.Tap();

			// Assert After Selection 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "MyListViewItem");
			_app.Screenshot("FocusManager - GetFocusedElement - ListViewItem - 2 - After Selection");
		}

		[Test]
		[AutoRetry]
		public void FocusManager_GetFocusedElement_ListViewItem_LostFocus_Validation()
		{
			Run("Uno.UI.Samples.Content.UITests.FocusManager.FocusManager_GetFocus_Automated");

			_app.WaitForElement(_app.Marked("TxtCurrentFocused"));

			var txtCurrentFocused = _app.Marked("TxtCurrentFocused");
			var listView = _app.Marked("MyListView");
			var frameworkElement = _app.Marked("MyListViewItem");

			_app.Tap(txtCurrentFocused);

			// Assert inital state 
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - LostFocus - ListViewItem - 1 - Inital State");

			frameworkElement.Tap();
			_app.Wait(2);

			_app.TapCoordinates(20, 100);

			// Assert Click outside
			_app.WaitForDependencyPropertyValue(txtCurrentFocused, "Text", "");
			_app.Screenshot("FocusManager - LostFocus - ListViewItem - 2 - Click outside");
		}
	}
}
