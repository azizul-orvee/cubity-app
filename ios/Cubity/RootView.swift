import SwiftUI

enum ShellPhase {
    case loading
    case ready
    case offline
}

@MainActor
final class WebSession: ObservableObject {
    static let home = URL(string: "https://cubity-app.vercel.app/")!
    static let host = "cubity-app.vercel.app"

    @Published var phase: ShellPhase = .loading
    @Published var shareURL: URL?
    @Published var reloadID = 0

    func showReady() {
        guard phase == .loading else { return }
        phase = .ready
    }

    func showOffline() {
        phase = .offline
    }

    func retry() {
        phase = .loading
        reloadID += 1
    }
}

struct RootView: View {
    @StateObject private var session = WebSession()
    @State private var keyboardOverlap: CGFloat = 0

    private let brand = Color(red: 18 / 255, green: 140 / 255, blue: 134 / 255)
    private let page = Color(red: 244 / 255, green: 251 / 255, blue: 251 / 255)

    var body: some View {
        GeometryReader { geo in
            let top = geo.safeAreaInsets.top
            let bottom = geo.safeAreaInsets.bottom
            VStack(spacing: 0) {
                brand.frame(height: top)
                ZStack {
                    page
                    CubityWebView(session: session)
                    if session.phase == .loading {
                        splash
                    }
                    if session.phase == .offline {
                        offline
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                Color.white.frame(height: max(bottom, keyboardOverlap))
            }
            .frame(width: geo.size.width, height: geo.size.height)
            .background(brand)
        }
        .ignoresSafeArea()
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillChangeFrameNotification)) { note in
            guard let frame = note.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? CGRect else {
                keyboardOverlap = 0
                return
            }
            let window = UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap(\.windows)
                .first(where: \.isKeyWindow)
            let height = window?.bounds.height ?? 0
            keyboardOverlap = height > 0 ? max(0, height - frame.minY) : 0
        }
        .sheet(item: shareItem) { item in
            ShareSheet(url: item.url)
        }
    }

    private var shareItem: Binding<ShareItem?> {
        Binding(
            get: { session.shareURL.map(ShareItem.init) },
            set: { session.shareURL = $0?.url }
        )
    }

    private var splash: some View {
        VStack(spacing: 0) {
            Image("SplashLogo")
                .resizable()
                .frame(width: 112, height: 112)
            Text("CUBITY")
                .font(.system(size: 18, weight: .bold))
                .tracking(3)
                .foregroundStyle(.white)
                .padding(.top, 18)
            Text("Receivables")
                .font(.system(size: 14))
                .foregroundStyle(.white.opacity(0.7))
                .padding(.top, 4)
            ProgressView()
                .tint(.white)
                .padding(.top, 28)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(brand)
    }

    private var offline: some View {
        VStack(spacing: 0) {
            Image("SplashLogo")
                .resizable()
                .frame(width: 96, height: 96)
            Text("CUBITY")
                .font(.system(size: 16, weight: .bold))
                .tracking(2)
                .foregroundStyle(.white)
                .padding(.top, 20)
            Text("Can’t reach Cubity right now.\nCheck internet and try again.")
                .font(.system(size: 15))
                .multilineTextAlignment(.center)
                .foregroundStyle(.white.opacity(0.7))
                .padding(.top, 10)
            Button("Try again") {
                session.retry()
            }
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(brand)
            .padding(.horizontal, 28)
            .frame(minHeight: 48)
            .background(.white, in: Capsule())
            .padding(.top, 24)
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(brand)
    }
}

struct ShareItem: Identifiable {
    let url: URL
    var id: String { url.path }
}

struct ShareSheet: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: [url], applicationActivities: nil)
    }

    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}
