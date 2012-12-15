(ns yapin.bar
  (:use [cljs.core :only [clj->js]]
        [clojure.browser.event :only [listen]]))

;(def form-field-search (atom {}))

(defn active-browser-window []
  js/safari.application.activeBrowserWindow)

(defn find-element [window id]
  (let [document (.-document window)]
    (.getElementById document id)))

(defn find-extension-bars [identifier browser-window]
  (filter #(and (= identifier (.-identifier %))
                (or (nil? browser-window) (= browser-window (.-browserWindow %)))) 
         	js/safari.extension.bars))

(defn dispatch-page-message [name message]
  (let [page js/safari.application.activeBrowserWindow.activeTab.page]
    (.dispatchMessage page name message)))

(defn form-field-search-handle-key-down [event]
  (dispatch-page-message "slide-page-in" ["1", "2"]))

(defn do-it []
	(doseq [bar (find-extension-bars "bar" nil)]
    (let [button (find-element (.-contentWindow bar) "test")]
      (listen button :click form-field-search-handle-key-down))))

(do-it)

;(js/alert (active-browser-window))