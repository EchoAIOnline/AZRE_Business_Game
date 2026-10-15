import Foundation
import PDFKit
import Vision
import AppKit
struct PageText: Codable { let page: Int; let text: String }
guard CommandLine.arguments.count == 2, let pdf = PDFDocument(url: URL(fileURLWithPath: CommandLine.arguments[1])), pdf.pageCount <= 250 else { exit(1) }
var results: [PageText] = []
for i in 0..<pdf.pageCount {
 guard let page = pdf.page(at: i) else { exit(2) }
 let image = page.thumbnail(of: NSSize(width: 1800, height: 2400), for: .mediaBox)
 guard let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else { exit(3) }
 let request = VNRecognizeTextRequest()
 request.recognitionLevel = .accurate
 request.recognitionLanguages = ["en-US"]
 request.usesLanguageCorrection = true
 do { try VNImageRequestHandler(cgImage: cg).perform([request]) } catch { exit(4) }
 let text = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }.joined(separator: "\n")
 results.append(PageText(page: i + 1, text: text))
}
guard let data = try? JSONEncoder().encode(results) else { exit(5) }
FileHandle.standardOutput.write(data)
