(ns yapin.bar
  (:use [yapin.util :only [clj->js active-browser-window global-ns find-element find-extension-bar dispatch-page-message]]
        [clojure.browser.event :only [listen]]))

;(def form-field-search (atom {}))

(defn find-bookmarks [text]
	(.find-bookmarks global-ns text))

;(swap! my-atom assoc :a "1")
(defn form-field-search-handle-key-press [event]
  (let [key-code (.-keyCode event)]
    (when (= key-code 13)
      (this-as this 
               (let [value (.-value this)
                     result (find-bookmarks value)]
                 (dispatch-page-message "slide-page-in" (clj->js result))))))
	;(swap! form-field-search assoc :value "")
  )

(defn register-event-handlers []
	(let [bar (find-extension-bar "bar")]
    (let [content-window (.-contentWindow bar)
          form-field-search (find-element content-window "form-field-search")]
      (listen form-field-search :keypress form-field-search-handle-key-press))))

(register-event-handlers)

; - hide extension bar