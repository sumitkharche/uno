﻿namespace Uno.UI {

	export class WindowManager {

		public static current: WindowManager;
		private static _isHosted: boolean = false;
		private static _isLoadEventsEnabled: boolean = false;

		/**
		 * Defines if the WindowManager is running in hosted mode, and should skip the
		 * initialization of WebAssembly, use this mode in conjunction with the Uno.UI.WpfHost
		 * to improve debuggability.
		 */
		public static get isHosted(): boolean {
			return WindowManager._isHosted;
		}

		/**
		 * Defines if the WindowManager is responsible to raise the loading, loaded and unloaded events,
		 * or if they are raised directly by the managed code to reduce interop.
		 */
		public static get isLoadEventsEnabled(): boolean {
			return WindowManager._isLoadEventsEnabled;
		}

		private static readonly unoRootClassName = "uno-root-element";
		private static readonly unoUnarrangedClassName = "uno-unarranged";

		private static _cctor = (() => {
			WindowManager.initMethods();
			HtmlDom.initPolyfills();
		})();

		/**
			* Initialize the WindowManager
			* @param containerElementId The ID of the container element for the Xaml UI
			* @param loadingElementId The ID of the loading element to remove once ready
			*/
		public static init(isHosted: boolean, isLoadEventsEnabled: boolean, containerElementId: string = "uno-body", loadingElementId: string = "uno-loading"): string {

			WindowManager._isHosted = isHosted;
			WindowManager._isLoadEventsEnabled = isLoadEventsEnabled;

			Windows.UI.Core.CoreDispatcher.init(WindowManager.buildReadyPromise());

			this.current = new WindowManager(containerElementId, loadingElementId);
			MonoSupport.jsCallDispatcher.registerScope("Uno", this.current);
			this.current.init();

			return "ok";
		}

		/**
		 * Builds a promise that will signal the ability for the dispatcher
		 * to initiate work.
		 * */
		private static buildReadyPromise(): Promise<boolean>  {
			return new Promise<boolean>(resolve => {
				Promise.all(
					[WindowManager.buildSplashScreen()]
				).then(() => resolve(true))
			});
		}

		/**
		 * Build the splashscreen image eagerly
		 * */
		private static buildSplashScreen(): Promise<boolean> {
			return new Promise<boolean>(resolve => {
				const img = new Image();
				let loaded = false;

				let loadingDone = () => {
					if (!loaded) {
						loaded = true;
						if (img.width !== 0 && img.height !== 0) {
							// Materialize the image content so it shows immediately
							// even if the dispatcher is blocked thereafter by all
							// the Uno initialization work. The resulting canvas is not used.
							//
							// If the image fails to load, setup the splashScreen anyways with the
							// proper sample.
							let canvas = document.createElement('canvas');
							canvas.width = img.width;
							canvas.height = img.height;
							let ctx = canvas.getContext("2d");
							ctx.drawImage(img, 0, 0);
						}

						if (document.readyState === "loading") {
							document.addEventListener("DOMContentLoaded", () => {
								WindowManager.setupSplashScreen(img);
								resolve(true);
							});
						} else {
							WindowManager.setupSplashScreen(img);
							resolve(true);
						}
					}
				};

				// Preload the splash screen so the image element
				// created later on 
				img.onload = loadingDone;
				img.onerror = loadingDone;
				img.src = String(UnoAppManifest.splashScreenImage);

				// If there's no response, skip the loading
				setTimeout(loadingDone, 2000);
			});
		}

		/**
			* Initialize the WindowManager
			* @param containerElementId The ID of the container element for the Xaml UI
			* @param loadingElementId The ID of the loading element to remove once ready
			*/
		public static initNative(pParams: number): boolean {

			const params = WindowManagerInitParams.unmarshal(pParams);

			WindowManager.init(params.IsHostedMode, params.IsLoadEventsEnabled);

			return true;
		}

		private containerElement: HTMLDivElement;
		private rootContent: HTMLElement;

		private allActiveElementsById: { [id: number]: HTMLElement | SVGElement } = {};

		private static resizeMethod: any;
		private static dispatchEventMethod: any;
		private static getDependencyPropertyValueMethod: any;

		private constructor(private containerElementId: string, private loadingElementId: string) {
			this.initDom();
		}

		/**
			* Creates the UWP-compatible splash screen
			* 
			*/
		static setupSplashScreen(splashImage:HTMLImageElement): void {

			if (UnoAppManifest && UnoAppManifest.splashScreenImage) {

				const loading = document.getElementById("loading");

				if (loading) {
					loading.remove();
				}

				const unoBody = document.getElementById("uno-body");

				if (unoBody) {
					const unoLoading = document.createElement("div");
					unoLoading.id = "uno-loading";

					if (UnoAppManifest.splashScreenColor) {
						const body = document.getElementsByTagName("body")[0];
						body.style.backgroundColor = UnoAppManifest.splashScreenColor;
					}

					splashImage.id = "uno-loading-splash";
					splashImage.classList.add("uno-splash");

					unoLoading.appendChild(splashImage);

					unoBody.appendChild(unoLoading);
				}
			}
		}

		/**
			* Reads the window's search parameters
			* 
			*/
		static findLaunchArguments(): string {
			if (typeof URLSearchParams === "function") {
				return new URLSearchParams(window.location.search).toString();
			}
			else {
				const queryIndex = document.location.search.indexOf('?');

				if (queryIndex !== -1) {
					return document.location.search.substring(queryIndex + 1);
				}

				return "";
			}
		}

		/**
			* Create a html DOM element representing a Xaml element.
			*
			* You need to call addView to connect it to the DOM.
			*/
		public createContent(contentDefinition: IContentDefinition): string {
			this.createContentInternal(contentDefinition);

			return "ok";
		}

		/**
			* Create a html DOM element representing a Xaml element.
			*
			* You need to call addView to connect it to the DOM.
			*/
		public createContentNative(pParams: number): boolean {

			const params = WindowManagerCreateContentParams.unmarshal(pParams);

			const def = <IContentDefinition> {
				id: params.HtmlId,
				handle: params.Handle,
				isFocusable: params.IsFocusable,
				isFrameworkElement: params.IsFrameworkElement,
				isSvg: params.IsSvg,
				tagName: params.TagName,
				type: params.Type,
				classes: params.Classes
			};

			this.createContentInternal(def);

			return true;
		}

		private createContentInternal(contentDefinition: IContentDefinition): void {
			// Create the HTML element
			const element =
				contentDefinition.isSvg
					? document.createElementNS("http://www.w3.org/2000/svg", contentDefinition.tagName)
					: document.createElement(contentDefinition.tagName);
			element.id = String(contentDefinition.id);
			element.setAttribute("XamlType", contentDefinition.type);
			element.setAttribute("XamlHandle", `${contentDefinition.handle}`);
			if (contentDefinition.isFrameworkElement) {
				this.setAsUnarranged(element);
			}
			if (element.hasOwnProperty("tabindex")) {
				(element as any)["tabindex"] = contentDefinition.isFocusable ? 0 : -1;
			} else {
				element.setAttribute("tabindex", contentDefinition.isFocusable ? "0" : "-1");
			}

			if (contentDefinition) {
				for (const className of contentDefinition.classes) {
					element.classList.add(`uno-${className}`);
				}
			}

			// Add the html element to list of elements
			this.allActiveElementsById[contentDefinition.id] = element;
		}

		public getView(elementHandle: number): HTMLElement | SVGElement {
			const element = this.allActiveElementsById[elementHandle];
			if (!element) {
				throw `Element id ${elementHandle} not found.`;
			}
			return element;
		}

		/**
			* Set a name for an element.
			*
			* This is mostly for diagnostic purposes.
			*/
		public setName(elementId: number, name: string): string {
			this.setNameInternal(elementId, name);
			return "ok";
		}

		/**
			* Set a name for an element.
			*
			* This is mostly for diagnostic purposes.
			*/
		public setNameNative(pParam: number): boolean {
			const params = WindowManagerSetNameParams.unmarshal(pParam);
			this.setNameInternal(params.HtmlId, params.Name);
			return true;
		}

		private setNameInternal(elementId: number, name: string): void {
			this.getView(elementId).setAttribute("xamlname", name);
		}


		/**
			* Set a name for an element.
			*
			* This is mostly for diagnostic purposes.
			*/
		public setXUid(elementId: number, name: string): string {
			this.setXUidInternal(elementId, name);
			return "ok";
		}

		/**
			* Set a name for an element.
			*
			* This is mostly for diagnostic purposes.
			*/
		public setXUidNative(pParam: number): boolean {
			const params = WindowManagerSetXUidParams.unmarshal(pParam);
			this.setXUidInternal(params.HtmlId, params.Uid);
			return true;
		}

		private setXUidInternal(elementId: number, name: string): void {
			this.getView(elementId).setAttribute("xuid", name);
		}

		/**
			* Set an attribute for an element.
			*/
		public setAttributes(elementId: number, attributes: { [name: string]: string }): string {
			const element = this.getView(elementId);

			for (const name in attributes) {
				if (attributes.hasOwnProperty(name)) {
					element.setAttribute(name, attributes[name]);
				}
			}

			return "ok";
		}

		/**
			* Set an attribute for an element.
			*/
		public setAttributesNative(pParams: number): boolean {

			const params = WindowManagerSetAttributesParams.unmarshal(pParams);
			const element = this.getView(params.HtmlId);

			for (let i = 0; i < params.Pairs_Length; i += 2) {
				element.setAttribute(params.Pairs[i], params.Pairs[i + 1]);
			}

			return true;
		}

		/**
			* Set an attribute for an element.
			*/
		public setAttributeNative(pParams: number): boolean {

			const params = WindowManagerSetAttributeParams.unmarshal(pParams);
			const element = this.getView(params.HtmlId);
			element.setAttribute(params.Name, params.Value);

			return true;
		}

		/**
			* Get an attribute for an element.
			*/
		public getAttribute(elementId: number, name: string): any {

			return this.getView(elementId).getAttribute(name);
		}

		/**
			* Set a property for an element.
			*/
		public setProperty(elementId: number, properties: { [name: string]: string }): string {
			const element = this.getView(elementId);

			for (const name in properties) {
				if (properties.hasOwnProperty(name)) {
					var setVal = properties[name];
					if (setVal === "true") {
						(element as any)[name] = true;
					}
					else if (setVal === "false") {
						(element as any)[name] = false;
					}
					else {
						(element as any)[name] = setVal;
					}
				}
			}

			return "ok";
		}

		/**
			* Set a property for an element.
			*/
		public setPropertyNative(pParams:number): boolean {

			const params = WindowManagerSetPropertyParams.unmarshal(pParams);
			const element = this.getView(params.HtmlId);

			for (let i = 0; i < params.Pairs_Length; i += 2) {
				var setVal = params.Pairs[i + 1];
				if (setVal === "true") {
					(element as any)[params.Pairs[i]] = true;
				}
				else if (setVal === "false") {
					(element as any)[params.Pairs[i]] = false;
				}
				else {
					(element as any)[params.Pairs[i]] = setVal;
				}
			}

			return true;
		}

		/**
			* Get a property for an element.
			*/
		public getProperty(elementId: number, name: string): any {
			const element = this.getView(elementId);

			return (element as any)[name] || "";
		}

		/**
			* Set the CSS style of a html element.
			*
			* To remove a value, set it to empty string.
			* @param styles A dictionary of styles to apply on html element.
			*/
		public setStyle(elementId: number, styles: { [name: string]: string }, setAsArranged: boolean = false): string {
			const element = this.getView(elementId);

			for (const style in styles) {
				if (styles.hasOwnProperty(style)) {
					element.style.setProperty(style, styles[style]);
				}
			}

			if (setAsArranged) {
				this.setAsArranged(element);
			}

			return "ok";
		}

		/**
		* Set the CSS style of a html element.
		*
		* To remove a value, set it to empty string.
		* @param styles A dictionary of styles to apply on html element.
		*/
		public setStyleNative(pParams: number): boolean {

			const params = WindowManagerSetStylesParams.unmarshal(pParams);
			const element = this.getView(params.HtmlId);

			const elementStyle = element.style;
			const pairs = params.Pairs;

			for (let i = 0; i < params.Pairs_Length; i += 2) {
				const key = pairs[i];
				const value = pairs[i + 1];

				elementStyle.setProperty(key, value);
			}

			if (params.SetAsArranged) {
				this.setAsArranged(element);
			}

			return true;
		}

		/**
		* Set a single CSS style of a html element
		*
		*/
		public setStyleDoubleNative(pParams: number): boolean {

			const params = WindowManagerSetStyleDoubleParams.unmarshal(pParams);
			const element = this.getView(params.HtmlId);

			element.style.setProperty(params.Name, String(params.Value));

			return true;
		}

		/**
			* Set the CSS style of a html element.
			*
			* To remove a value, set it to empty string.
			* @param styles A dictionary of styles to apply on html element.
			*/
		public resetStyle(elementId: number, names: string[]): string {
			this.resetStyleInternal(elementId, names);
			return "ok";
		}

		/**
			* Set the CSS style of a html element.
			*
			* To remove a value, set it to empty string.
			* @param styles A dictionary of styles to apply on html element.
			*/
		public resetStyleNative(pParams: number): boolean {
			const params = WindowManagerResetStyleParams.unmarshal(pParams);
			this.resetStyleInternal(params.HtmlId, params.Styles);
			return true;
		}

		private resetStyleInternal(elementId: number, names: string[]): void {
			const element = this.getView(elementId);

			for(const name of names) {
				element.style.setProperty(name, "");
			}
		}

		/**
		 * Set CSS classes on an element
		 */
		public setClasses(elementId: number, cssClassesList: string[], classIndex: number): string {
			const element = this.getView(elementId);

			for (let i = 0; i < cssClassesList.length; i++) {
				if (i === classIndex) {
					element.classList.add(cssClassesList[i]);
				} else {
					element.classList.remove(cssClassesList[i]);
				}
			}
			return "ok";
		}

		public setClassesNative(pParams: number): boolean {
			const params = WindowManagerSetClassesParams.unmarshal(pParams);
			this.setClasses(params.HtmlId, params.CssClasses, params.Index);
			return true;
		}

		/**
		* Arrange and clips a native elements 
		*
		*/
		public arrangeElementNative(pParams: number): boolean {

			const params = WindowManagerArrangeElementParams.unmarshal(pParams);
			const element = this.getView(params.HtmlId);

			const style = element.style;

			style.position = "absolute";
			style.top = params.Top + "px";
			style.left = params.Left + "px";
			style.width = params.Width === NaN ? "auto" : params.Width + "px";
			style.height = params.Height === NaN ? "auto" : params.Height + "px";

			if (params.Clip) {
				style.clip = `rect(${params.ClipTop}px, ${params.ClipRight}px, ${params.ClipBottom}px, ${params.ClipLeft}px)`;
			} else {
				style.clip = "";
			}

			this.setAsArranged(element);

			return true;
		}

		private setAsArranged(element: HTMLElement | SVGElement) {

			element.classList.remove(WindowManager.unoUnarrangedClassName);
		}

		private setAsUnarranged(element: HTMLElement | SVGElement) {
			element.classList.add(WindowManager.unoUnarrangedClassName);
		}

		/**
		* Sets the transform matrix of an element
		*
		*/
		public setElementTransformNative(pParams: number): boolean {

			const params = WindowManagerSetElementTransformParams.unmarshal(pParams);
			const element = this.getView(params.HtmlId);

			var style = element.style;

			style.transform = `matrix(${params.M11},${params.M12},${params.M21},${params.M22},${params.M31},${params.M32})`;

			element.classList.remove(WindowManager.unoUnarrangedClassName);

			return true;
		}

		/**
			* Load the specified URL into a new tab or window
			* @param url URL to load
			* @returns "True" or "False", depending on whether a new window could be opened or not
			*/
		public open(url: string): string {
			const newWindow = window.open(url, "_blank");

			return newWindow != null
				? "True"
				: "False";
		}

		/**
			* Issue a browser alert to user
			* @param message message to display
			*/
		public alert(message: string): string {
			window.alert(message);

			return "ok";
		}

		/**
			* Sets the browser window title
			* @param message the new title
			*/
		public setWindowTitle(title: string): string {
			document.title = title || UnoAppManifest.displayName;
			return "ok";
		}

		/**
			* Gets the currently set browser window title
			*/
		public getWindowTitle(): string {
			return document.title || UnoAppManifest.displayName;
		}

		/**
			* Add an event handler to a html element.
			*
			* @param eventName The name of the event
			* @param onCapturePhase true means "on trickle down" (going down to target), false means "on bubble up" (bubbling back to ancestors). Default is false.
			*/
		public registerEventOnView(
			elementId: number,
			eventName: string,
			onCapturePhase: boolean = false,
			eventFilterName?: string,
			eventExtractorName?: string
		): string {
			this.registerEventOnViewInternal(elementId, eventName, onCapturePhase, eventFilterName, eventExtractorName);
			return "ok";
		}

		/**
			* Add an event handler to a html element.
			*
			* @param eventName The name of the event
			* @param onCapturePhase true means "on trickle down", false means "on bubble up". Default is false.
			*/
		public registerEventOnViewNative(
			pParams: number
		): boolean {
			const params = WindowManagerRegisterEventOnViewParams.unmarshal(pParams);

			this.registerEventOnViewInternal(params.HtmlId, params.EventName, params.OnCapturePhase, params.EventFilterName, params.EventExtractorName);
			return true;
		}

		private processPendingLeaveEvent: (evt: PointerEvent) => void;

		private _isPendingLeaveProcessingEnabled: boolean;

		/**
		 * Ensure that any pending leave event are going to be processed (cf @see processPendingLeaveEvent )
		 */
		private ensurePendingLeaveEventProcessing() {
			if (this._isPendingLeaveProcessingEnabled) {
				return;
			}

			// Register an event listener on move in order to process any pending event (leave).
			document.addEventListener(
				"pointermove",
				evt => {
					if (this.processPendingLeaveEvent) {
						this.processPendingLeaveEvent(evt as PointerEvent);
					}
				},
				true); // in the capture phase to get it as soon as possible, and to make sure to respect the events ordering
			this._isPendingLeaveProcessingEnabled = true;
		}

		/**
			* Add an event handler to a html element.
			*
			* @param eventName The name of the event
			* @param onCapturePhase true means "on trickle down", false means "on bubble up". Default is false.
			*/
		private registerEventOnViewInternal(
			elementId: number,
			eventName: string,
			onCapturePhase: boolean = false,
			eventFilterName?: string,
			eventExtractorName?: string
		): void {
			const element = this.getView(elementId);
			const eventExtractor = this.getEventExtractor(eventExtractorName);
			const eventHandler = (event: Event) => {
				console.log("Raising event " + eventName + " on element " + elementId);

				const eventPayload = eventExtractor
					? `${eventExtractor(event)}`
					: "";

				var handled = this.dispatchEvent(element, eventName, eventPayload);
				if (handled) {
					event.stopPropagation();
				}
			};

			console.log("Subscribing to event " + eventName + " on element " + elementId);

			if (eventName == "pointerenter") {
				const enterPointerHandler = (event: Event) => {
					const e = event as any;

					if (e.explicitOriginalTarget) { // FF only

						// It happens on FF that when another control which is over the 'element' has been updated, like text or visibility changed,
						// we receive a pointer enter/leave of an element which is under an element that is capable to handle pointers,
						// which is unexpected as the "pointerenter" should not bubble.
						// So we have to validate that this event is effectively due to the pointer entering the control.
						// We achieve this by browsing up the elements under the pointer (** not the visual tree**) 

						const evt = event as PointerEvent;
						for (let elt of document.elementsFromPoint(evt.pageX, evt.pageY)) {
							if (elt == element) {
								// We found our target element, we can raise the event and stop the loop
								eventHandler(event);
								return;
							}

							let htmlElt = elt as HTMLElement;
							if (htmlElt.style.pointerEvents != "none") {
								// This 'htmlElt' is handling the pointers events, this mean that we can stop the loop.
								// However, if this 'htmlElt' is one of our child it means that the event was legitimate
								// and we have to raise it for the 'element'.
								while (htmlElt.parentElement) {
									htmlElt = htmlElt.parentElement;
									if (htmlElt == element) {
										eventHandler(event);
										return;
									}
								}

								// We found an element this is capable to handle the pointers but which is not one of our child
								// (probably a sibling which is covering the element). It means that the pointerEnter/Leave should
								// not have bubble to the element, and we can mute it.
								return;
							}
						}
					} else {
						eventHandler(event);
					}
				}

				element.addEventListener(eventName, enterPointerHandler, onCapturePhase);
			} else if (eventName == "pointerleave") {
				const leavePointerHandler = (event: Event) => {
					const e = event as any;

					if (e.explicitOriginalTarget // FF only
						&& e.explicitOriginalTarget !== event.currentTarget
						&& (event as PointerEvent).isOver(element)) {

						// If the event was re-targeted, it's suspicious as the leave event should not bubble
						// This happens on FF when another control which is over the 'element' has been updated, like text or visibility changed.
						// So we have to validate that this event is effectively due to the pointer leaving the element.
						// We achieve that by buffering it until the next few 'pointermove' on document for which we validate the new pointer location.

						// It's common to get a move right after the leave with the same pointer's location,
						// so we wait up to 3 pointer move before dropping the leave event.
						var attempt = 3;

						this.ensurePendingLeaveEventProcessing();
						this.processPendingLeaveEvent = (move: PointerEvent) => {
							if (!move.isOverDeep(element)) {
								console.log("Raising deferred pointerleave on element " + elementId);
								eventHandler(event);

								this.processPendingLeaveEvent = null;
							} else if (--attempt <= 0) {
								console.log("Drop deferred pointerleave on element " + elementId);

								this.processPendingLeaveEvent = null;
							} else {
								console.log("Requeue deferred pointerleave on element " + elementId);
							}
						};

					} else {
						eventHandler(event);
					}
				}

				element.addEventListener(eventName, leavePointerHandler, onCapturePhase);
			} else {
				element.addEventListener(eventName, eventHandler, onCapturePhase);
			}
		}

		/**
		 * left pointer event filter to be used with registerEventOnView
		 * @param evt
		 */
		private leftPointerEventFilter(evt: PointerEvent): boolean {
			return evt ? evt.eventPhase === 2 || evt.eventPhase === 3 && (!evt.button || evt.button === 0) : false;
		}

		/**
		 * default event filter to be used with registerEventOnView to
		 * use for most routed events
		 * @param evt
		 */
		private defaultEventFilter(evt: Event): boolean {
			return evt ? evt.eventPhase === 2 || evt.eventPhase === 3 : false;
		}

		/**
		 * Gets the event filter function. See UIElement.HtmlEventFilter
		 * @param eventFilterName an event filter name.
		 */
		private getEventFilter(eventFilterName: string): any {

			if (eventFilterName) {
				switch (eventFilterName) {
				case "LeftPointerEventFilter":
					return this.leftPointerEventFilter;
				case "Default":
					return this.defaultEventFilter;
				}

				throw `Event filter ${eventFilterName} is not supported`;
			}

			return null;
		}

		/**
		 * pointer event extractor to be used with registerEventOnView
		 * @param evt
		 */
		private pointerEventExtractor(evt: PointerEvent): string {
			return evt
				? `${evt.pointerId};${evt.clientX};${evt.clientY};${(evt.ctrlKey ? "1" : "0")};${(evt.shiftKey ? "1" : "0")};${evt.button};${evt.pointerType}`
				: "";
		}

		/**
		 * keyboard event extractor to be used with registerEventOnView
		 * @param evt
		 */
		private keyboardEventExtractor(evt: Event): string {
			return (evt instanceof KeyboardEvent) ? evt.key : "0";
		}

		/**
		 * tapped (mouse clicked / double clicked) event extractor to be used with registerEventOnView
		 * @param evt
		 */
		private tappedEventExtractor(evt: MouseEvent): string {
			return evt
				? `0;${evt.clientX};${evt.clientY};${(evt.ctrlKey ? "1" : "0")};${(evt.shiftKey ? "1" : "0")};${evt.button};mouse`
				: "";
		}

		/**
		 * tapped (mouse clicked / double clicked) event extractor to be used with registerEventOnView
		 * @param evt
		 */
		private focusEventExtractor(evt: FocusEvent): string {

			if (evt) {
				const targetElement: HTMLElement | SVGElement = <any>evt.target;

				if (targetElement) {
					const targetXamlHandle = targetElement.getAttribute("XamlHandle");

					if (targetXamlHandle) {
						return `${targetXamlHandle}`;
					}
				}
			}

			return "";
		}

		private customEventDetailExtractor(evt: CustomEvent): string {
			if (evt) {
				const detail = evt.detail;
				if (detail) {
					return JSON.stringify(detail);
				}
			}

			return "";
		}

		private customEventDetailStringExtractor(evt: CustomEvent): string {
			return evt ? `${evt.detail}` : "";
		}

		/**
		 * Gets the event extractor function. See UIElement.HtmlEventExtractor
		 * @param eventExtractorName an event extractor name.
		 */
		private getEventExtractor(eventExtractorName: string): (evt: Event) => string {

			if (eventExtractorName) {
				switch (eventExtractorName) {
					case "PointerEventExtractor":
						return this.pointerEventExtractor;

					case "KeyboardEventExtractor":
						return this.keyboardEventExtractor;

					case "TappedEventExtractor":
						return this.tappedEventExtractor;

					case "FocusEventExtractor":
						return this.focusEventExtractor;

					case "CustomEventDetailJsonExtractor":
						return this.customEventDetailExtractor;

					case "CustomEventDetailStringExtractor":
						return this.customEventDetailStringExtractor;
				}

				throw `Event filter ${eventExtractorName} is not supported`;
			}

			return null;
		}

		/**
			* Set or replace the root content element.
			*/
		public setRootContent(elementId?: number): string {
			if (this.rootContent && Number(this.rootContent.id) === elementId) {
				return null; // nothing to do
			}

			if (this.rootContent) {
				// Remove existing
				this.containerElement.removeChild(this.rootContent);

				if (WindowManager.isLoadEventsEnabled) {
					this.dispatchEvent(this.rootContent, "unloaded");
				}
				this.rootContent.classList.remove(WindowManager.unoRootClassName);
			}

			if (!elementId) {
				return null;
			}

			// set new root
			const newRootElement = this.getView(elementId) as HTMLElement;
			newRootElement.classList.add(WindowManager.unoRootClassName);

			this.rootContent = newRootElement;

			if (WindowManager.isLoadEventsEnabled) {
				this.dispatchEvent(this.rootContent, "loading");
			}

			this.containerElement.appendChild(this.rootContent);

			if (WindowManager.isLoadEventsEnabled) {
				this.dispatchEvent(this.rootContent, "loaded");
			}
			this.setAsArranged(newRootElement); // patch because root is not measured/arranged

			this.resize();

			return "ok";
		}

		/**
			* Set a view as a child of another one.
			*
			* "Loading" & "Loaded" events will be raised if necessary.
			*
			* @param index Position in children list. Appended at end if not specified.
			*/
		public addView(parentId: number, childId: number, index?: number): string {
			this.addViewInternal(parentId, childId, index);
			return "ok";
		}

		/**
			* Set a view as a child of another one.
			*
			* "Loading" & "Loaded" events will be raised if necessary.
			*
			* @param pParams Pointer to a WindowManagerAddViewParams native structure.
			*/
		public addViewNative(pParams: number): boolean {
			const params = WindowManagerAddViewParams.unmarshal(pParams);

			this.addViewInternal(
				params.HtmlId,
				params.ChildView,
				params.Index != -1 ? params.Index : null
			);

			return true;
		}

		public addViewInternal(parentId: number, childId: number, index?: number): void {
			const parentElement = this.getView(parentId);
			const childElement = this.getView(childId);

			let shouldRaiseLoadEvents = false;
			if (WindowManager.isLoadEventsEnabled) {
				const alreadyLoaded = this.getIsConnectedToRootElement(childElement);
				shouldRaiseLoadEvents = !alreadyLoaded && this.getIsConnectedToRootElement(parentElement);

				if (shouldRaiseLoadEvents) {
					this.dispatchEvent(childElement, "loading");
				}
			}

			if (index && index < parentElement.childElementCount) {
				const insertBeforeElement = parentElement.children[index];
				parentElement.insertBefore(childElement, insertBeforeElement);

			} else {
				parentElement.appendChild(childElement);
			}

			if (shouldRaiseLoadEvents) {
				this.dispatchEvent(childElement, "loaded");
			}
		}

		/**
			* Remove a child from a parent element.
			*
			* "Unloading" & "Unloaded" events will be raised if necessary.
			*/
		public removeView(parentId: number, childId: number): string {
			this.removeViewInternal(parentId, childId);
			return "ok";
		}

		/**
			* Remove a child from a parent element.
			*
			* "Unloading" & "Unloaded" events will be raised if necessary.
			*/
		public removeViewNative(pParams: number): boolean {
			const params = WindowManagerRemoveViewParams.unmarshal(pParams);
			this.removeViewInternal(params.HtmlId, params.ChildView);
			return true;
		}

		private removeViewInternal(parentId: number, childId: number): void {
			const parentElement = this.getView(parentId);
			const childElement = this.getView(childId);

			const shouldRaiseLoadEvents = WindowManager.isLoadEventsEnabled
				&& this.getIsConnectedToRootElement(childElement);

			parentElement.removeChild(childElement);

			// Mark the element as unarranged, so if it gets measured while being
			// disconnected from the root element, it won't be visible.
			this.setAsUnarranged(childElement);

			if (shouldRaiseLoadEvents) {
				this.dispatchEvent(childElement, "unloaded");
			}
		}

		/**
			* Destroy a html element.
			*
			* The element won't be available anymore. Usually indicate the managed
			* version has been scavenged by the GC.
			*/
		public destroyView(elementId: number): string {
			this.destroyViewInternal(elementId);
			return "ok";
		}

		/**
			* Destroy a html element.
			*
			* The element won't be available anymore. Usually indicate the managed
			* version has been scavenged by the GC.
			*/
		public destroyViewNative(pParams: number): boolean {
			const params = WindowManagerDestroyViewParams.unmarshal(pParams);
			this.destroyViewInternal(params.HtmlId);
			return true;
		}

		private destroyViewInternal(elementId: number): void {
			const element = this.getView(elementId);

			if (element.parentElement) {
				element.parentElement.removeChild(element);
			}

			delete this.allActiveElementsById[elementId];
		}

		public getBoundingClientRect(elementId: number): string {

			const bounds = (<any>this.getView(elementId)).getBoundingClientRect();
			return `${bounds.left};${bounds.top};${bounds.right-bounds.left};${bounds.bottom-bounds.top}`;
		}

		public getBBox(elementId: number): string {
			const bbox = this.getBBoxInternal(elementId);

			return `${bbox.x};${bbox.y};${bbox.width};${bbox.height}`;
		}

		public getBBoxNative(pParams: number, pReturn: number): boolean {

			const params = WindowManagerGetBBoxParams.unmarshal(pParams);

			const bbox = this.getBBoxInternal(params.HtmlId);

			const ret = new WindowManagerGetBBoxReturn();
			ret.X = bbox.x;
			ret.Y = bbox.y;
			ret.Width = bbox.width;
			ret.Height = bbox.height;

			ret.marshal(pReturn);

			return true;
		}

		private getBBoxInternal(elementId: number): any {
			return (<any>this.getView(elementId)).getBBox();
		}

		/**
			* Use the Html engine to measure the element using specified constraints.
			*
			* @param maxWidth string containing width in pixels. Empty string means infinite.
			* @param maxHeight string containing height in pixels. Empty string means infinite.
			*/
		public measureView(viewId: string, maxWidth: string, maxHeight: string): string {

			const ret = this.measureViewInternal(Number(viewId), maxWidth ? Number(maxWidth) : NaN, maxHeight ? Number(maxHeight) : NaN);

			return `${ret[0]};${ret[1]}`;
		}

		/**
			* Use the Html engine to measure the element using specified constraints.
			*
			* @param maxWidth string containing width in pixels. Empty string means infinite.
			* @param maxHeight string containing height in pixels. Empty string means infinite.
			*/
		public measureViewNative(pParams: number, pReturn: number): boolean {

			const params = WindowManagerMeasureViewParams.unmarshal(pParams);

			const ret = this.measureViewInternal(params.HtmlId, params.AvailableWidth, params.AvailableHeight);

			const ret2 = new WindowManagerMeasureViewReturn();
			ret2.DesiredWidth = ret[0];
			ret2.DesiredHeight = ret[1];

			ret2.marshal(pReturn);

			return true;
		}

		private static MAX_WIDTH = `${Number.MAX_SAFE_INTEGER}vw`;
		private static MAX_HEIGHT = `${Number.MAX_SAFE_INTEGER}vh`;

		private measureViewInternal(viewId: number, maxWidth: number, maxHeight: number): [number, number] {
			const element = this.getView(viewId) as HTMLElement;

			const elementStyle = element.style;
			const originalStyleCssText = elementStyle.cssText;
			let parentElement: HTMLElement = null;
			let parentElementWidthHeight: { width: string, height: string } = null;

			try {
				if (!element.isConnected) {
					// If the element is not connected to the DOM, we need it
					// to be connected for the measure to provide a meaningful value.

					let unconnectedRoot = element;
					while (unconnectedRoot.parentElement) {
						// Need to find the top most "unconnected" parent
						// of this element
						unconnectedRoot = unconnectedRoot.parentElement as HTMLElement;
					}

					this.containerElement.appendChild(unconnectedRoot);
				}

				// As per W3C css-transform spec:
				// https://www.w3.org/TR/css-transforms-1/#propdef-transform
				//
				// > For elements whose layout is governed by the CSS box model, any value other than none
				// > for the transform property also causes the element to establish a containing block for
				// > all descendants.Its padding box will be used to layout for all of its
				// > absolute - position descendants, fixed - position descendants, and descendant fixed
				// > background attachments.
				//
				// We use this feature to allow an measure of text without being influenced by the bounds
				// of the viewport. We just need to temporary set both the parent width & height to a very big value.

				parentElement = element.parentElement;
				parentElementWidthHeight = { width: parentElement.style.width, height: parentElement.style.height };
				parentElement.style.width = WindowManager.MAX_WIDTH;
				parentElement.style.height = WindowManager.MAX_HEIGHT;

				const updatedStyles = <any>{};

				for (let i = 0; i < elementStyle.length; i++) {
					const key = elementStyle[i];
					updatedStyles[key] = elementStyle.getPropertyValue(key);
				}

				if (updatedStyles.hasOwnProperty("width")) {
					delete updatedStyles.width;
				}
				if (updatedStyles.hasOwnProperty("height")) {
					delete updatedStyles.height;
				}

				// This is required for an unconstrained measure (otherwise the parents size is taken into account)
				updatedStyles.position = "fixed";
				updatedStyles["max-width"] = Number.isFinite(maxWidth) ? maxWidth + "px" : "none";
				updatedStyles["max-height"] = Number.isFinite(maxHeight) ? maxHeight + "px" : "none";

				let updatedStyleString = "";

				for (let key in updatedStyles) {
					if (updatedStyles.hasOwnProperty(key)) {
						updatedStyleString += key + ": " + updatedStyles[key] + "; ";
					}
				}

				// We use a string to prevent the browser to update the element between
				// each style assignation. This way, the browser will update the element only once.
				elementStyle.cssText = updatedStyleString;

				if (element instanceof HTMLImageElement) {
					const imgElement = element as HTMLImageElement;
					return [imgElement.naturalWidth, imgElement.naturalHeight];
				}
				else {
					const offsetWidth = element.offsetWidth;
					const offsetHeight = element.offsetHeight;

					const resultWidth = offsetWidth ? offsetWidth : element.clientWidth;
					const resultHeight = offsetHeight ? offsetHeight : element.clientHeight;

					// +0.5 is added to take rounding into account
					return [resultWidth + 0.5, resultHeight];
				}
			}
			finally {
				elementStyle.cssText = originalStyleCssText;

				if (parentElement && parentElementWidthHeight) {
					parentElement.style.width = parentElementWidthHeight.width;
					parentElement.style.height = parentElementWidthHeight.height;
				}
			}
		}

		public setImageRawData(viewId: number, dataPtr: number, width: number, height: number): string {
			const element = this.getView(viewId);

			if (element.tagName.toUpperCase() === "IMG") {
				const imgElement = element as HTMLImageElement;

				const rawCanvas = document.createElement("canvas");
				rawCanvas.width = width;
				rawCanvas.height = height;

				const ctx = rawCanvas.getContext("2d");
				const imgData = ctx.createImageData(width, height);

				const bufferSize = width * height * 4;

				for (let i = 0; i < bufferSize; i += 4) {
					imgData.data[i + 0] = Module.HEAPU8[dataPtr + i + 2];
					imgData.data[i + 1] = Module.HEAPU8[dataPtr + i + 1];
					imgData.data[i + 2] = Module.HEAPU8[dataPtr + i + 0];
					imgData.data[i + 3] = Module.HEAPU8[dataPtr + i + 3];
				}
				ctx.putImageData(imgData, 0, 0);

				imgElement.src = rawCanvas.toDataURL();

				return "ok";
			}
		}


		/**
		 * Sets the provided image with a mono-chrome version of the provided url.
		 * @param viewId the image to manipulate
		 * @param url the source image
		 * @param color the color to apply to the monochrome pixels
		 */
		public setImageAsMonochrome(viewId: number, url: string, color: string): string {
			const element = this.getView(viewId);

			if (element.tagName.toUpperCase() === "IMG") {

				const imgElement = element as HTMLImageElement;
				var img = new Image();
				img.onload = buildMonochromeImage;
				img.src = url;

				function buildMonochromeImage() {

					// create a colored version of img
					const c = document.createElement('canvas');
					const ctx = c.getContext('2d');

					c.width = img.width;
					c.height = img.height;

					ctx.drawImage(img, 0, 0);
					ctx.globalCompositeOperation = 'source-atop';
					ctx.fillStyle = color;
					ctx.fillRect(0, 0, img.width, img.height);
					ctx.globalCompositeOperation = 'source-over';

					imgElement.src = c.toDataURL();
				}

				return "ok";
			}
			else {
				throw `setImageAsMonochrome: Element id ${viewId} is not an Img.`;
			}
		}

		public setPointerCapture(viewId: number, pointerId: number): string {
			this.getView(viewId).setPointerCapture(pointerId);

			return "ok";
		}

		public releasePointerCapture(viewId: number, pointerId: number): string {
			this.getView(viewId).releasePointerCapture(pointerId);

			return "ok";
		}

		public focusView(elementId: number): string {
			const element = this.getView(elementId);

			if (!(element instanceof HTMLElement)) {
				throw `Element id ${elementId} is not focusable.`;
			}

			element.focus();

			return "ok";
		}

		/**
			* Set the Html content for an element.
			*
			* Those html elements won't be available as XamlElement in managed code.
			* WARNING: you should avoid mixing this and `addView` for the same element.
			*/
		public setHtmlContent(viewId: number, html: string): string {
			this.setHtmlContentInternal(viewId, html);
			return "ok";
		}

		/**
			* Set the Html content for an element.
			*
			* Those html elements won't be available as XamlElement in managed code.
			* WARNING: you should avoid mixing this and `addView` for the same element.
			*/
		public setHtmlContentNative(pParams: number): boolean {
			const params = WindowManagerSetContentHtmlParams.unmarshal(pParams);

			this.setHtmlContentInternal(params.HtmlId, params.Html);
			return true;
		}

		private setHtmlContentInternal(viewId: number, html: string): void {

			this.getView(viewId).innerHTML = html;
		}

		/**
		 * Gets the Client and Offset size of the specified element
		 *
		 * This method is used to determine the size of the scroll bars, to
		 * mask the events coming from that zone.
		 */
		public getClientViewSize(elementId: number): string {
			const element = this.getView(elementId) as HTMLElement;

			return `${element.clientWidth};${element.clientHeight};${element.offsetWidth};${element.offsetHeight}`;
		}

		/**
		 * Gets the Client and Offset size of the specified element
		 *
		 * This method is used to determine the size of the scroll bars, to
		 * mask the events coming from that zone.
		 */
		public getClientViewSizeNative(pParams: number, pReturn: number): boolean {
			const params = WindowManagerGetClientViewSizeParams.unmarshal(pParams);

			const element = this.getView(params.HtmlId) as HTMLElement;

			const ret2 = new WindowManagerGetClientViewSizeReturn();
			ret2.ClientWidth = element.clientWidth;
			ret2.ClientHeight = element.clientHeight;
			ret2.OffsetWidth = element.offsetWidth;
			ret2.OffsetHeight = element.offsetHeight;

			ret2.marshal(pReturn);

			return true;
		}

		/**
		 * Gets a dependency property value.
		 *
		 * Note that the casing of this method is intentionally Pascal for platform alignment.
		 */
		public GetDependencyPropertyValue(elementId: number, propertyName: string) : string {
			if (!WindowManager.getDependencyPropertyValueMethod) {
				WindowManager.getDependencyPropertyValueMethod = (<any>Module).mono_bind_static_method("[Uno.UI] Uno.UI.Helpers.Automation:GetDependencyPropertyValue");
			}

			const element = this.getView(elementId) as HTMLElement;
			const htmlId = Number(element.getAttribute("XamlHandle"));

			return WindowManager.getDependencyPropertyValueMethod(htmlId, propertyName);
		}

		/**
			* Remove the loading indicator.
			*
			* In a future version it will also handle the splashscreen.
			*/
		public activate(): string {
			this.removeLoading();
			return "ok";
		}

		private init() {

			if (UnoAppManifest.displayName) {
				document.title = UnoAppManifest.displayName;
			}

		}

		private static initMethods() {
			if (WindowManager.isHosted) {
				console.debug("Hosted Mode: Skipping MonoRuntime initialization ");
			}
			else {
				if (!WindowManager.resizeMethod) {
					WindowManager.resizeMethod = (<any>Module).mono_bind_static_method("[Uno.UI] Windows.UI.Xaml.Window:Resize");
				}

				if (!WindowManager.dispatchEventMethod) {
					WindowManager.dispatchEventMethod = (<any>Module).mono_bind_static_method("[Uno.UI] Windows.UI.Xaml.UIElement:DispatchEvent");
				}
			}
		}

		private initDom() {
			this.containerElement = (document.getElementById(this.containerElementId) as HTMLDivElement);
			if (!this.containerElement) {
				// If not found, we simply create a new one.
				this.containerElement = document.createElement("div");
				document.body.appendChild(this.containerElement);
			}

			window.addEventListener("resize", x => this.resize());
		}

		private removeLoading() {

			if (!this.loadingElementId) {
				return;
			}

			const element = document.getElementById(this.loadingElementId);
			if (element) {
				element.parentElement.removeChild(element);
			}

			// UWP Window's default background is white.
			const body = document.getElementsByTagName("body")[0];
			body.style.backgroundColor = "#fff";
		}

		private resize() {

			if (WindowManager.isHosted) {
				UnoDispatch.resize(`${document.documentElement.clientWidth};${document.documentElement.clientHeight}`);
			}
			else {
				WindowManager.resizeMethod(document.documentElement.clientWidth, document.documentElement.clientHeight);
			}
		}

		private dispatchEvent(element: HTMLElement | SVGElement, eventName: string, eventPayload: string = null): boolean {
			const htmlId = Number(element.getAttribute("XamlHandle"));
			
			// console.debug(`${element.getAttribute("id")}: Raising event ${eventName}.`);

			if (!htmlId) {
				throw `No attribute XamlHandle on element ${element}. Can't raise event.`;
			}

			if (WindowManager.isHosted) {
				// Dispatch to the C# backed UnoDispatch class. Events propagated
				// this way always succeed because synchronous calls are not possible
				// between the host and the browser, unlike wasm.
				UnoDispatch.dispatch(String(htmlId), eventName, eventPayload);
				return true;
			}
			else {
				return WindowManager.dispatchEventMethod(htmlId, eventName, eventPayload || "");
			}
		}

		private getIsConnectedToRootElement(element: HTMLElement | SVGElement): boolean {
			const rootElement = this.rootContent;

			if (!rootElement) {
				return false;
			}
			return rootElement === element || rootElement.contains(element);
		}
	}

	if (typeof define === "function") {
		define(
			["AppManifest"],
			() => {
			}
		);
	}
	else {
		throw `The Uno.Wasm.Boostrap is not up to date, please upgrade to a later version`;
	}
}
