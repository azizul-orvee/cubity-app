import SwiftUI
import WebKit

struct CubityWebView: UIViewRepresentable {
    @ObservedObject var session: WebSession

    func makeCoordinator() -> Coordinator {
        Coordinator(session: session)
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.applicationNameForUserAgent = "CubityApp/1.0"

        let webView = LockedWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.bounces = true
        webView.scrollView.alwaysBounceHorizontal = false
        webView.scrollView.showsHorizontalScrollIndicator = false
        webView.scrollView.showsVerticalScrollIndicator = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.keyboardDismissMode = .interactive
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 244 / 255, green: 251 / 255, blue: 251 / 255, alpha: 1)
        context.coordinator.webView = webView
        webView.load(URLRequest(url: WebSession.home))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        guard context.coordinator.lastReloadID != session.reloadID else { return }
        context.coordinator.lastReloadID = session.reloadID
        webView.load(URLRequest(url: WebSession.home))
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate {
        let session: WebSession
        weak var webView: WKWebView?
        var lastReloadID = 0
        private var downloadURL: URL?

        init(session: WebSession) {
            self.session = session
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            preferences: WKWebpagePreferences,
            decisionHandler: @escaping (WKNavigationActionPolicy, WKWebpagePreferences) -> Void
        ) {
            if navigationAction.shouldPerformDownload {
                decisionHandler(.download, preferences)
                return
            }
            guard let url = navigationAction.request.url else {
                decisionHandler(.allow, preferences)
                return
            }
            if shouldLeaveApp(url) {
                UIApplication.shared.open(url)
                decisionHandler(.cancel, preferences)
                return
            }
            decisionHandler(.allow, preferences)
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationResponse: WKNavigationResponse,
            decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void
        ) {
            let mime = navigationResponse.response.mimeType?.lowercased() ?? ""
            let name = navigationResponse.response.suggestedFilename?.lowercased() ?? ""
            if mime == "application/pdf" || name.hasSuffix(".pdf") || !navigationResponse.canShowMIMEType {
                decisionHandler(.download)
                return
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
            download.delegate = self
        }

        func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse, didBecome download: WKDownload) {
            download.delegate = self
        }

        func download(_ download: WKDownload, decideDestinationUsing response: URLResponse, suggestedFilename: String) async -> URL? {
            let folder = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let destination = folder.appendingPathComponent(suggestedFilename)
            try? FileManager.default.removeItem(at: destination)
            downloadURL = destination
            return destination
        }

        func downloadDidFinish(_ download: WKDownload) {
            guard let downloadURL else { return }
            Task { @MainActor in
                session.shareURL = downloadURL
            }
        }

        func download(_ download: WKDownload, didFailWithError error: Error, resumeData: Data?) {
            downloadURL = nil
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            Task { @MainActor in
                if session.phase == .offline {
                    session.phase = .loading
                }
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            webView.evaluateJavaScript(Self.chromeJS)
            Task { @MainActor in
                session.showReady()
            }
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            guard !isIgnorable(error) else { return }
            Task { @MainActor in
                session.showOffline()
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            guard !isIgnorable(error) else { return }
            Task { @MainActor in
                session.showOffline()
            }
        }

        private func isIgnorable(_ error: Error) -> Bool {
            let code = (error as NSError).code
            return code == NSURLErrorCancelled || code == 102
        }

        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = navigationAction.request.url {
                if shouldLeaveApp(url) {
                    Task { await UIApplication.shared.open(url) }
                } else {
                    webView.load(URLRequest(url: url))
                }
            }
            return nil
        }

        private func shouldLeaveApp(_ url: URL) -> Bool {
            let scheme = url.scheme?.lowercased() ?? ""
            if ["tel", "mailto", "sms", "whatsapp"].contains(scheme) {
                return true
            }
            let host = url.host?.lowercased() ?? ""
            if host == "wa.me" || host == "whatsapp.com" || host.hasSuffix(".whatsapp.com") {
                return true
            }
            if host == WebSession.host || host.hasSuffix(".vercel.app") {
                return false
            }
            return scheme == "http" || scheme == "https"
        }

        private static let chromeJS = """
        (function () {
          var root = document.documentElement;
          if (!root) return;
          root.classList.add('cubity-app');
          if (!document.getElementById('cubity-app-chrome')) {
            var style = document.createElement('style');
            style.id = 'cubity-app-chrome';
            style.textContent = [
              'html.cubity-app, html.cubity-app body {',
              '  overflow-x: clip !important;',
              '  max-width: 100% !important;',
              '  overscroll-behavior-x: none;',
              '  touch-action: pan-y;',
              '}',
              'html.cubity-app .app-header-inner { padding-top: 0 !important; }',
              'html.cubity-app .app-bottom-nav { padding-bottom: 0 !important; }',
              'html.keyboard-open .app-bottom-nav { display: none !important; }',
              'html.keyboard-open .app-main { padding-bottom: 1.5rem !important; }',
              'input, textarea, select { scroll-margin-top: 6rem; scroll-margin-bottom: 8rem; }'
            ].join('');
            (document.head || root).appendChild(style);
          }
          if (window.__cubityKeyboard) return;
          window.__cubityKeyboard = true;
          function hideFormNav() {
            if (/\\/clients\\/new$|\\/clients\\/[^/]+\\/(edit|due|pay)$/.test(location.pathname)) {
              var nav = document.querySelector('.app-bottom-nav');
              if (nav) nav.style.display = 'none';
            }
          }
          hideFormNav();
          var vv = window.visualViewport;
          if (!vv) return;
          function sync() {
            var open = (window.innerHeight - vv.height) > 100;
            root.classList.toggle('keyboard-open', open);
            var el = document.activeElement;
            if (open && el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
              setTimeout(function () {
                el.scrollIntoView({ block: 'center', behavior: 'smooth' });
              }, 80);
            }
          }
          vv.addEventListener('resize', sync);
          vv.addEventListener('scroll', sync);
        })();
        """
    }
}

final class LockedWebView: WKWebView {
    override func layoutSubviews() {
        super.layoutSubviews()
        if scrollView.contentOffset.x != 0 {
            scrollView.contentOffset.x = 0
        }
    }
}
