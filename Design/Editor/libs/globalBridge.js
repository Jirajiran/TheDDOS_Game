/**
 * Editor-only canvas bridge (ไม่เกี่ยวกับงาน Menu / aistudio).
 * Animate Include → libs/globalBridge.js | Template ชี้ libs/globalBridge.js
 * Layout ไม่ตาม browser zoom (Ctrl/Alt +/-)
 */
(function (global) {
	"use strict";

	function patchMakeResponsive() {
		if (global.AdobeAn) {
			global.AdobeAn.makeResponsive = function () {};
		}
	}

	patchMakeResponsive();

	/** จับขนาด layout ตอน resize จริง — ไม่ตาม Alt/Ctrl +/- page zoom */
	var _layoutBase = null;

	function estimatePageZoom(innerW, dprRaw) {
		var zoomOuter = 1;
		if (global.outerWidth && innerW) {
			zoomOuter = global.outerWidth / innerW;
		}
		var zoom = zoomOuter;
		if (_layoutBase && _layoutBase.deviceDpr > 0) {
			var zoomDpr = dprRaw / _layoutBase.deviceDpr;
			if (Math.abs(zoomDpr - 1) > Math.abs(zoomOuter - 1)) {
				zoom = zoomDpr;
			}
		}
		if (!(zoom > 0.45 && zoom < 3.5)) zoom = 1;
		return zoom;
	}

	function measureLayoutViewport() {
		var innerW = global.innerWidth || 1;
		var innerH = global.innerHeight || 1;
		var dprRaw = global.devicePixelRatio || 1;
		var outerW = global.outerWidth || innerW;
		var outerH = global.outerHeight || innerH;
		var zoom = estimatePageZoom(innerW, dprRaw);
		var layoutW = Math.round(innerW * zoom);
		var layoutH = Math.round(innerH * zoom);
		var deviceDpr = dprRaw / zoom;
		if (!(deviceDpr > 0.5 && deviceDpr < 4)) deviceDpr = dprRaw;

		if (!_layoutBase) {
			_layoutBase = {
				outerW: outerW,
				outerH: outerH,
				layoutW: layoutW,
				layoutH: layoutH,
				deviceDpr: deviceDpr
			};
		} else {
			// เปลี่ยนขนาดหน้าต่างจริง (ไม่ใช่แค่ page zoom) → อัปเดตฐาน
			var resized =
				Math.abs(outerW - _layoutBase.outerW) > 4 ||
				Math.abs(outerH - _layoutBase.outerH) > 4;
			if (resized) {
				_layoutBase.outerW = outerW;
				_layoutBase.outerH = outerH;
				_layoutBase.layoutW = layoutW;
				_layoutBase.layoutH = layoutH;
				_layoutBase.deviceDpr = deviceDpr;
			}
		}

		return {
			w: _layoutBase.layoutW,
			h: _layoutBase.layoutH,
			dpr: _layoutBase.deviceDpr,
			zoom: zoom,
			cssW: innerW,
			cssH: innerH
		};
	}

	global.UIBus = global.UIBus || new createjs.EventDispatcher();
	global.EditorData = global.EditorData || { doc: null };

	// ================= Map create (MAP_CREATE_REQUEST → MAP_DATA_READY) =================
	var FALLBACK_DAMAGE_MATRIX = {
		DEFAULT: { DEFAULT: 1, BULLET: 1.25, EXPLOSION: 0.9, LAZER: 0.75 },
		BULLET: { DEFAULT: 0.5, BULLET: 0.75, EXPLOSION: 0.85, LAZER: 0.5 },
		EXPLOSION: { DEFAULT: 1.4, BULLET: 0.9, EXPLOSION: 0.7, LAZER: 0.8 },
		LAZER: { DEFAULT: 1.6, BULLET: 1.4, EXPLOSION: 1.1, LAZER: 0.6 }
	};

	function sanitizeMapName(raw) {
		var text = String(raw || "")
			.trim()
			.toLowerCase()
			.replace(/\s+/g, "_")
			.replace(/[^a-z0-9_-]/g, "");
		return text || "untitled_map";
	}

	var GRID_MIN = 2;
	var GRID_MAX = 16;

	function clampSide(value) {
		var side = value | 0;
		if (side < GRID_MIN || side > GRID_MAX) return 0;
		return side;
	}

	/** กันพิมพ์: ตัวเลขอย่างเดียว; เกิน max ตัดทันที; finalize แล้วต่ำกว่า min → ดันเป็น min */
	function constrainGridSideInput(raw, finalize) {
		var digits = String(raw == null ? "" : raw).replace(/[^0-9]/g, "");
		if (digits === "") return finalize ? String(GRID_MIN) : "";
		var n = parseInt(digits, 10);
		if (isNaN(n)) return finalize ? String(GRID_MIN) : "";
		if (n > GRID_MAX) return String(GRID_MAX);
		if (finalize && n < GRID_MIN) return String(GRID_MIN);
		return String(n);
	}

	function createMapDoc(opts) {
		opts = opts || {};
		var pathCols = clampSide(opts.pathCols);
		var pathRows = clampSide(opts.pathRows);
		if (!pathCols || !pathRows) {
			throw new Error("Path grid must be " + GRID_MIN + " to " + GRID_MAX + " on each side");
		}
		return {
			kind: "theddos-map",
			version: "1",
			name: sanitizeMapName(opts.name),
			pathCols: pathCols,
			pathRows: pathRows,
			pathLocked: true,
			areas: [],
			placedObjects: [],
			spawns: [],
			playerSpawns: [
				{ role: "host", unitId: "PLAYER", team: 1, areaId: "" }
			],
			playerFriendlyFire: false,
			units: opts.units || {},
			weapons: opts.weapons || {},
			items: opts.items || {},
			skills: opts.skills || {},
			rules: opts.rules || {},
			teams: [
				{ id: 1, name: "Team 1" },
				{ id: 2, name: "Team 2" }
			],
			damageMatrix: {
				version: "1.0.0",
				matrix: JSON.parse(JSON.stringify(FALLBACK_DAMAGE_MATRIX))
			}
		};
	}

	function wireMapCreateBridge() {
		if (global.EditorBridge && global.EditorBridge._mapCreateWired) return;
		if (!global.EditorBridge) global.EditorBridge = {};
		global.EditorBridge._mapCreateWired = true;

		global.UIBus.off("MAP_CREATE_REQUEST", global.EditorBridge._onMapCreateRequest);
		global.EditorBridge._onMapCreateRequest = function (evt) {
			var payload = (evt && evt.payload) || {};
			try {
				if (global.UIInput && typeof global.UIInput.commit === "function") {
					global.UIInput.commit();
				}
				var doc = createMapDoc(payload);
				global.EditorData = global.EditorData || { doc: null };
				global.EditorData.doc = doc;
				global.UIBus.dispatchEvent({ type: "MAP_DATA_READY", doc: doc });
			} catch (err) {
				console.error("[EditorBridge] MAP_CREATE_REQUEST failed:", err && err.message ? err.message : err);
			}
		};
		global.UIBus.on("MAP_CREATE_REQUEST", global.EditorBridge._onMapCreateRequest);
	}

	// ================= UIScreen =================
	if (!global.UIScreen) {
		global.UIScreen = (function () {
			var bus = new createjs.EventDispatcher();
			var m0 = measureLayoutViewport();
			bus.w = m0.w;
			bus.h = m0.h;
			bus.dpr = m0.dpr;
			bus.zoom = m0.zoom;

			bus.apply = function (force) {
				patchMakeResponsive();

				var cv = bus.cv || global.canvas || document.querySelector("canvas");
				var st = bus.st || global.stage || (cv && cv.__stage) || (global.exportRoot && global.exportRoot.stage);
				if (!cv || !st) return false;
				if (!bus.cv) bus.cv = cv;
				if (!bus.st) bus.st = st;

				var m = measureLayoutViewport();
				var w = m.w;
				var h = m.h;
				var dpr = m.dpr;
				var cssW = m.cssW;
				var cssH = m.cssH;
				var bw = Math.round(w * dpr);
				var bh = Math.round(h * dpr);

				if (!force && bus._ready &&
					cv.width === bw && cv.height === bh &&
					cv.style.width === cssW + "px" && cv.style.height === cssH + "px" &&
					st.scaleX === dpr && st.scaleY === dpr &&
					bus.w === w && bus.h === h) {
					return false;
				}
				bus._ready = true;

				[global.anim_container, global.dom_overlay_container].forEach(function (c) {
					if (c) {
						c.style.width = cssW + "px";
						c.style.height = cssH + "px";
					}
				});

				cv.width = bw;
				cv.height = bh;
				cv.style.width = cssW + "px";
				cv.style.height = cssH + "px";
				st.scaleX = st.scaleY = dpr;

				bus.w = w;
				bus.h = h;
				bus.dpr = dpr;
				bus.zoom = m.zoom;
				bus.dispatchEvent({ type: "SCREEN_RESIZE", w: w, h: h, dpr: dpr, zoom: m.zoom });

				var t = st.tickOnUpdate;
				st.tickOnUpdate = false;
				st.update();
				st.tickOnUpdate = t;
				return true;
			};

			global.addEventListener("resize", function () { bus.apply(); });
			if (global.visualViewport) {
				global.visualViewport.addEventListener("resize", function () { bus.apply(); });
				global.visualViewport.addEventListener("scroll", function () { bus.apply(); });
			}

			return bus;
		})();
	}

	// ================= UIAnchor =================
	if (!global.UIAnchor) {
		global.UIAnchor = (function () {
			var items = [];
			var api = { base: null };

			function getBase(it) {
				return it.base || api.base || { width: 1280, height: 720 };
			}

			function layoutSize() {
				if (global.UIScreen && global.UIScreen.w && global.UIScreen.h) {
					return { w: global.UIScreen.w, h: global.UIScreen.h };
				}
				var m = measureLayoutViewport();
				return { w: m.w, h: m.h };
			}

			function snap(it) {
				var o = it.obj;
				if (!o || !o.parent) return;

				var b = getBase(it);
				var size = layoutSize();
				var w = size.w;
				var h = size.h;

				if (!o._origOffset) {
					o._origOffset = {
						initialX: o.x,
						initialY: o.y,
						offsetRight: b.width - o.x,
						offsetBottom: b.height - o.y,
						offsetCenterX: o.x - (b.width / 2),
						offsetCenterY: o.y - (b.height / 2)
					};
				}

				var orig = o._origOffset;

				switch (it.anchor) {
					case "TOP_LEFT":
						o.x = orig.initialX;
						o.y = orig.initialY;
						break;
					case "TOP_CENTER":
						o.x = (w / 2) + orig.offsetCenterX;
						o.y = orig.initialY;
						break;
					case "TOP_RIGHT":
						o.x = w - orig.offsetRight;
						o.y = orig.initialY;
						break;
					case "MIDDLE_LEFT":
						o.x = orig.initialX;
						o.y = (h / 2) + orig.offsetCenterY;
						break;
					case "CENTER":
						o.x = (w / 2) + orig.offsetCenterX;
						o.y = (h / 2) + orig.offsetCenterY;
						break;
					case "MIDDLE_RIGHT":
						o.x = w - orig.offsetRight;
						o.y = (h / 2) + orig.offsetCenterY;
						break;
					case "BOTTOM_LEFT":
						o.x = orig.initialX;
						o.y = h - orig.offsetBottom;
						break;
					case "BOTTOM_CENTER":
						o.x = (w / 2) + orig.offsetCenterX;
						o.y = h - orig.offsetBottom;
						break;
					case "BOTTOM_RIGHT":
						o.x = w - orig.offsetRight;
						o.y = h - orig.offsetBottom;
						break;
				}

				if (it.fill) {
					if (o._origScaleX === undefined) {
						o._origScaleX = o.scaleX;
						o._origScaleY = o.scaleY;
					}
					o.x = w / 2;
					o.y = h / 2;
					o.scaleX = o._origScaleX * (w / b.width);
					o.scaleY = o._origScaleY * (h / b.height);
				}
			}

			function snapAll() {
				for (var i = 0; i < items.length; i++) {
					snap(items[i]);
				}
			}

			api.attach = function (obj, anchor, base, opts) {
				if (!obj) return function () {};
				api.detach(obj);
				var it = {
					obj: obj,
					anchor: anchor,
					base: base || null,
					fill: !!(opts && opts.fill)
				};
				items.push(it);
				snap(it);
				return function () { api.detach(obj); };
			};

			api.detach = function (obj) {
				items = items.filter(function (it) { return it.obj !== obj; });
			};

			api.fill = function (obj, base) {
				return api.attach(obj, "CENTER", base, { fill: true });
			};

			api.updateAll = snapAll;

			global.UIScreen.on("SCREEN_RESIZE", snapAll);

			return api;
		})();
	}

	// ================= UIInputField (DOM overlay สำหรับ CardCreate ฯลฯ) =================
	var UIINPUT_VER = 4;
	if (global.UIInputField && global.UIInputField._ver === UIINPUT_VER) {
		// already current
	} else {
		if (global.UIInputField && typeof global.UIInputField.detachAll === "function") {
			try { global.UIInputField.detachAll(); } catch (e) {}
		}
		global.UIInputField = (function () {
			var items = [];

			function getArtElement(clip) {
				return clip.art_input || clip.art_bg || clip.bg || clip.box || clip.IdArt || clip;
			}

			function getTargetText(clip) {
				return clip.txt_val || clip.txt_input || clip.IdTextinput || clip.IdHashInput || clip.txt || clip.txt_Name || clip.txt_name;
			}

			function mountElement(el) {
				if (!el.parentNode) {
					var target = document.body || (document.documentElement && document.documentElement.lastChild) || document.documentElement;
					if (target) target.appendChild(el);
				}
			}

			/** Main Timeline Frame 1 เท่านั้น (JS index 0) */
			function getMainRoot() {
				return global.exportRoot ||
					(global.EditorBridge && global.EditorBridge.root) ||
					null;
			}

			function isMainFrame1() {
				var root = getMainRoot();
				// ยังไม่มี root ตอน attach แรก — ถือว่าอยู่ Frame 1 (CardCreate)
				if (!root || typeof root.currentFrame === "undefined") return true;
				return (root.currentFrame | 0) === 0;
			}

			function isClipLive(clip) {
				if (!clip || !clip.stage) return false;
				var o = clip;
				while (o) {
					if (o.visible === false) return false;
					if (o._off === true) return false;
					o = o.parent;
				}
				return true;
			}

			function setInputVisible(it, show) {
				if (!it || !it.inp) return;
				it.inp.style.display = show ? "block" : "none";
				if (!show) {
					try { it.inp.blur(); } catch (e) {}
				}
			}

			function place(it) {
				var clip = it.clip;
				var inp = it.inp;
				var cv = global.canvas || document.querySelector("canvas");
				if (!cv || !clip) {
					setInputVisible(it, false);
					return;
				}

				// กติกาหลัก: เฉพาะ Main Frame 1
				if (!isMainFrame1()) {
					setInputVisible(it, false);
					return;
				}

				if (!isClipLive(clip)) {
					setInputVisible(it, false);
					return;
				}

				var rect = cv.getBoundingClientRect();
				var art = getArtElement(clip);
				var txt = getTargetText(clip);
				var refObj = (art && art !== clip) ? art : clip;

				var b = (refObj && (refObj.nominalBounds || (refObj.getBounds && refObj.getBounds()))) ||
					(clip.nominalBounds || (clip.getBounds && clip.getBounds()));
				var bx = b ? b.x : 0;
				var by = b ? b.y : 0;
				var bw = b ? b.width : 160;
				var bh = b ? b.height : 36;

				var p0 = refObj.localToGlobal(bx, by);
				var p1 = refObj.localToGlobal(bx + bw, by + bh);

				var scaleX = rect.width / (cv.width || 1);
				var scaleY = rect.height / (cv.height || 1);

				var screenX = rect.left + (p0.x * scaleX);
				var screenY = rect.top + (p0.y * scaleY);
				var screenW = Math.max(Math.abs(p1.x - p0.x) * scaleX, 40);
				var screenH = Math.max(Math.abs(p1.y - p0.y) * scaleY, 24);

				// นอกจอ canvas → ซ่อน
				if (screenX + screenW < rect.left || screenY + screenH < rect.top ||
					screenX > rect.right || screenY > rect.bottom) {
					setInputVisible(it, false);
					return;
				}

				var isCenter = (it.opts && it.opts.align === "center") || (txt && txt.textAlign === "center");

				setInputVisible(it, true);
				inp.style.left = Math.round(screenX) + "px";
				inp.style.top = Math.round(screenY) + "px";
				inp.style.width = Math.round(screenW) + "px";
				inp.style.height = Math.round(screenH) + "px";
				inp.style.textAlign = isCenter ? "center" : "left";
				inp.style.fontSize = Math.max(12, Math.round(screenH * 0.45)) + "px";
				inp.style.lineHeight = Math.round(screenH) + "px";
				inp.style.paddingLeft = isCenter ? "0px" : "8px";
				inp.style.paddingRight = isCenter ? "0px" : "8px";
			}

			function syncText(it, typed) {
				var clip = it.clip;
				var txt = getTargetText(clip);
				if (txt) {
					txt.text = typed !== "" ? typed : (it.opts.placeholder || "");
					// DOM input โชว์ตลอด — ซ่อนข้อความบน canvas กันซ้อน
					txt.alpha = 0;
				}
			}

			function commit(it, save) {
				var inp = it.inp;
				var clip = it.clip;
				if (!inp) return;
				var typed = inp.value;

				if (save) {
					if (it.opts && it.opts.type === "number") {
						if (it.opts.min != null || it.opts.max != null) {
							typed = constrainGridSideInput(typed, true);
						} else {
							typed = typed.replace(/[^0-9]/g, "");
						}
						inp.value = typed;
					}
					clip._val = typed;
					syncText(it, typed);
					if (it.opts.onChange) it.opts.onChange(typed);
				}

				// โชว์คงที่เฉพาะตอน clip ยังอยู่บนเฟรมที่มีช่อง
				place(it);
				if (clip && clip.stage) clip.stage.update();
			}

			var api = {
				attach: function (clip, opts) {
					if (!clip) return function () {};
					api.detach(clip);
					opts = opts || {};

					var inp = document.createElement("input");
					inp.type = "text"; // ใช้ text + กรองเอง เพื่อคุมช่วงตัวเลขได้แน่น
					if (opts.type === "number") inp.inputMode = "numeric";
					inp.maxLength = opts.maxLength || (opts.type === "number" ? 4 : 32);
					inp.placeholder = opts.placeholder !== undefined ? String(opts.placeholder) : "";
					if (opts.min != null) inp.setAttribute("min", String(opts.min));
					if (opts.max != null) inp.setAttribute("max", String(opts.max));
					inp.style.cssText =
						"position:fixed;display:block;left:-9999px;top:-9999px;z-index:99999;box-sizing:border-box;margin:0;" +
						"background:rgba(18, 22, 30, 0.98);color:#ffffff;" +
						"border:2px solid #f59e0b;outline:none;padding:0 8px;border-radius:4px;" +
						"font-family:'Segoe UI', Tahoma, sans-serif;font-size:14px;pointer-events:auto;" +
						"box-shadow:0 0 12px rgba(245, 158, 11, 0.45);";

					mountElement(inp);

					var preVal = (clip._val !== undefined) ? clip._val : (clip.value !== undefined ? String(clip.value) : "");
					var initialVal = (opts.defaultValue !== undefined) ? String(opts.defaultValue) : preVal;
					if (opts.type === "number" && (opts.min != null || opts.max != null)) {
						initialVal = constrainGridSideInput(initialVal, true);
					}
					clip._val = initialVal;
					inp.value = initialVal;

					var it = { clip: clip, inp: inp, opts: opts };
					items.push(it);

					try {
						Object.defineProperty(clip, "value", {
							get: function () {
								return inp.value !== undefined ? inp.value : (clip._val !== undefined ? clip._val : "");
							},
							set: function (v) {
								clip._val = String(v);
								inp.value = clip._val;
								syncText(it, clip._val);
								place(it);
								if (clip.stage) clip.stage.update();
							},
							configurable: true,
							enumerable: true
						});
					} catch (err) {
						clip.value = initialVal;
					}

					syncText(it, clip._val);

					var isGridSide = opts.type === "number" && (opts.min != null || opts.max != null);

					inp.addEventListener("keydown", function (e) {
						if (e.key === "Enter") {
							commit(it, true);
							try { inp.blur(); } catch (err) {}
							return;
						}
						if (e.key === "Escape") {
							inp.value = clip._val !== undefined ? String(clip._val) : "";
							try { inp.blur(); } catch (err) {}
							return;
						}
						if (isGridSide) {
							var allow = e.key.length === 1 && e.key >= "0" && e.key <= "9";
							var nav = e.key === "Backspace" || e.key === "Delete" ||
								e.key === "ArrowLeft" || e.key === "ArrowRight" ||
								e.key === "Tab" || e.key === "Home" || e.key === "End";
							if (e.ctrlKey || e.metaKey || e.altKey) return;
							if (!allow && !nav) e.preventDefault();
						}
					});

					inp.addEventListener("input", function () {
						if (isGridSide) {
							var next = constrainGridSideInput(inp.value, false);
							if (inp.value !== next) inp.value = next;
						} else if (opts.type === "number") {
							inp.value = String(inp.value || "").replace(/[^0-9]/g, "");
						}
						clip._val = inp.value;
						syncText(it, inp.value);
					});

					inp.addEventListener("paste", function (e) {
						if (!isGridSide) return;
						e.preventDefault();
						var text = "";
						try {
							text = (e.clipboardData || global.clipboardData).getData("text") || "";
						} catch (err) {}
						inp.value = constrainGridSideInput(text, false);
						clip._val = inp.value;
						syncText(it, inp.value);
					});

					inp.addEventListener("blur", function () { commit(it, true); });

					var art = getArtElement(clip);
					var b = (art && (art.nominalBounds || (art.getBounds && art.getBounds()))) ||
						(clip.nominalBounds || (clip.getBounds && clip.getBounds()));
					var bx = b ? b.x : 0;
					var by = b ? b.y : 0;
					var bw = b ? b.width : 160;
					var bh = b ? b.height : 36;

					var hit = new createjs.Shape();
					hit.graphics.beginFill("#000").drawRect(bx, by, bw, bh);
					clip.hitArea = hit;
					clip.mouseChildren = false;
					clip.cursor = "text";

					var focusThis = function (evt) {
						if (evt) evt.stopPropagation();
						mountElement(inp);
						place(it);
						inp.style.display = "block";
						try { inp.focus(); inp.select(); } catch (e) {}
					};

					clip.openInput = focusThis;
					clip.removeAllEventListeners("click");
					clip.removeAllEventListeners("mousedown");
					clip.on("click", focusThis);

					clip.on("removed", function () { api.detach(clip); });

					function showNow() {
						mountElement(inp);
						place(it);
						inp.style.display = "block";
						if (clip.stage) clip.stage.update();
					}
					showNow();
					if (typeof requestAnimationFrame === "function") {
						requestAnimationFrame(showNow);
					}

					return function () { api.detach(clip); };
				},

				detach: function (clip) {
					for (var i = items.length - 1; i >= 0; i--) {
						if (items[i].clip === clip) {
							var it = items[i];
							commit(it, true);
							if (it.inp && it.inp.parentNode) it.inp.parentNode.removeChild(it.inp);
							clip.hitArea = null;
							clip.mouseChildren = true;
							clip.removeAllEventListeners("click");
							clip.removeAllEventListeners("mousedown");
							items.splice(i, 1);
						}
					}
				},

				commitAll: function () {
					if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
					for (var i = 0; i < items.length; i++) commit(items[i], true);
				},

				updateAllPositions: function () {
					for (var i = 0; i < items.length; i++) {
						place(items[i]);
					}
				},

				/** ซ่อนทุกช่อง (เช่น ออกจาก Frame 1 / ไม่มีพื้น TextField) */
				hideAll: function () {
					for (var i = 0; i < items.length; i++) {
						setInputVisible(items[i], false);
					}
				},

				/** ถอดทุกช่องออกจาก DOM — ใช้ตอนสลับไป Frame 2 */
				detachAll: function () {
					for (var i = items.length - 1; i >= 0; i--) {
						api.detach(items[i].clip);
					}
				}
			};

			global.addEventListener("resize", function () { api.updateAllPositions(); });
			if (global.UIScreen) {
				global.UIScreen.on("SCREEN_RESIZE", function () { api.updateAllPositions(); });
			}

			// ไป Frame 2 → commit แล้วซ่อน (visibility หลักดู currentFrame)
			global.UIBus.on("MAP_DATA_READY", function () {
				api.commitAll();
				api.hideAll();
			});

			// sync ตาม Main Frame ทุก ~200ms
			if (createjs && createjs.Ticker && !global.__UIInputFieldTickWired) {
				global.__UIInputFieldTickWired = true;
				var _tickAcc = 0;
				var _lastFrame = -1;
				createjs.Ticker.on("tick", function (e) {
					_tickAcc += (e && e.delta) ? e.delta : 16;
					if (_tickAcc < 200) return;
					_tickAcc = 0;
					var field = global.UIInputField;
					if (!field || typeof field.updateAllPositions !== "function") return;
					var root = global.exportRoot || (global.EditorBridge && global.EditorBridge.root);
					var fr = root ? (root.currentFrame | 0) : -1;
					if (fr !== _lastFrame) {
						_lastFrame = fr;
						if (fr !== 0) field.hideAll();
					}
					field.updateAllPositions();
				});
			}

			// คลิกพื้นว่าง / นอกช่อง input = Enter (commit + blur)
			if (!api._outsideWired) {
				api._outsideWired = true;
				global.addEventListener("mousedown", function (e) {
					var t = e && e.target;
					var i;
					for (i = 0; i < items.length; i++) {
						if (items[i].inp === t) return;
					}
					var active = document.activeElement;
					var focused = false;
					for (i = 0; i < items.length; i++) {
						if (items[i].inp === active) {
							focused = true;
							break;
						}
					}
					if (focused) api.commitAll();
				}, true);
			}

			api._ver = UIINPUT_VER;
			return api;
		})();
		global.UIInputField._ver = UIINPUT_VER;
	}

	// CardCreate เรียก UIInput.commit — ส่งต่อไป UIInputField
	global.UIInput = global.UIInput || {};
	global.UIInput.commit = function () {
		if (global.UIInputField && typeof global.UIInputField.commitAll === "function") {
			global.UIInputField.commitAll();
		}
	};

	function initGlobal(rootOrCtx) {
		patchMakeResponsive();
		wireMapCreateBridge();

		if (rootOrCtx) {
			global.EditorBridge.root = rootOrCtx;
			if (rootOrCtx.stage) {
				global.exportRoot = global.exportRoot || rootOrCtx;
			}
		}

		if (typeof lib !== "undefined" && lib.properties && global.UIAnchor) {
			global.UIAnchor.base = lib.properties;
		}

		var root = rootOrCtx || global.exportRoot || global.EditorBridge.root;
		var cv = global.canvas || document.querySelector("canvas");
		var st = global.stage || (root && root.stage) || (cv && cv.__stage);

		if (global.UIScreen) {
			if (cv) global.UIScreen.cv = cv;
			if (st) global.UIScreen.st = st;
		}

		function applyScreen() {
			if (global.UIScreen) global.UIScreen.apply(true);
		}

		applyScreen();
		if (typeof requestAnimationFrame === "function") {
			requestAnimationFrame(applyScreen);
		}

		return global.EditorBridge;
	}

	/**
	 * Short binding จาก CardCreate Frame 1: EditorBridge.initCardCreate(this)
	 * ผูก TextField + ปุ่ม Create ทั้งหมดอยู่ที่นี่
	 */
	function initCardCreate(card) {
		if (!card) return;

		global.UIBus = global.UIBus || new createjs.EventDispatcher();

		if (card.bg) card.bg.mouseEnabled = false;
		if (card.art_bg) card.art_bg.mouseEnabled = false;
		if (card.Color) card.Color.mouseEnabled = false;

		if (global.UIInputField) {
			if (card.input_name) {
				global.UIInputField.attach(card.input_name, {
					type: "text",
					placeholder: "untitled_map",
					defaultValue: "untitled_map",
					maxLength: 24,
					align: "left"
				});
			}
			if (card.input_cols) {
				global.UIInputField.attach(card.input_cols, {
					type: "number",
					placeholder: String(GRID_MIN),
					defaultValue: String(GRID_MIN),
					maxLength: 2,
					min: GRID_MIN,
					max: GRID_MAX,
					align: "center"
				});
			}
			if (card.input_rows) {
				global.UIInputField.attach(card.input_rows, {
					type: "number",
					placeholder: String(GRID_MIN),
					defaultValue: String(GRID_MIN),
					maxLength: 2,
					min: GRID_MIN,
					max: GRID_MAX,
					align: "center"
				});
			}
		}

		if (card.btn_create) {
			card.btn_create.cursor = "pointer";
			card.btn_create.removeAllEventListeners("click");
			card.btn_create.on("click", function (evt) {
				if (evt) evt.stopPropagation();

				if (global.UIInput && typeof global.UIInput.commit === "function") {
					global.UIInput.commit();
				}

				var rawName = card.input_name ? card.input_name.value : "";
				var rawCols = card.input_cols ? card.input_cols.value : "";
				var rawRows = card.input_rows ? card.input_rows.value : "";

				var safeName = String(rawName || "untitled_map")
					.trim()
					.toLowerCase()
					.replace(/\s+/g, "_")
					.replace(/[^a-z0-9_-]/g, "");

				var cols = parseInt(constrainGridSideInput(rawCols, true), 10);
				var rows = parseInt(constrainGridSideInput(rawRows, true), 10);

				if (card.input_cols) card.input_cols.value = String(cols);
				if (card.input_rows) card.input_rows.value = String(rows);

				if (isNaN(cols) || cols < GRID_MIN || cols > GRID_MAX || isNaN(rows) || rows < GRID_MIN || rows > GRID_MAX) {
					if (card.txt_error) {
						card.txt_error.text = "ขนาด Grid ต้องอยู่ระหว่าง " + GRID_MIN + " ถึง " + GRID_MAX + " เท่านั้น";
						if (card.stage) card.stage.update();
					}
					return;
				}

				if (card.txt_error) {
					card.txt_error.text = "";
					if (card.stage) card.stage.update();
				}

				global.UIBus.dispatchEvent({
					type: "MAP_CREATE_REQUEST",
					payload: {
						name: safeName || "untitled_map",
						pathCols: cols,
						pathRows: rows
					}
				});
			});
		}
	}

	global.EditorBridge = global.EditorBridge || {};
	global.EditorBridge.initGlobal = initGlobal;
	global.EditorBridge.initCardCreate = initCardCreate;
	global.EditorBridge.createMapDoc = createMapDoc;
	global.EditorBridge.applyScreen = function () {
		return global.UIScreen ? global.UIScreen.apply(true) : false;
	};
	global.EditorBridge.initTrailGroup = function (rail) {
		if (global.EditorPanels && typeof global.EditorPanels.initTrailGroup === "function") {
			global.EditorPanels.initTrailGroup(rail);
		}
	};
	global.EditorBridge.initEditorBar = function (bar) {
		if (global.EditorPanels && typeof global.EditorPanels.initEditorBar === "function") {
			global.EditorPanels.initEditorBar(bar);
		}
	};

	wireMapCreateBridge();
})(window);
