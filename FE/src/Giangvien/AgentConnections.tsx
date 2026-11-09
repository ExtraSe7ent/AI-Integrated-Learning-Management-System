import { useEffect, useState } from "react";
import { Copy, Check, Link2, ShieldCheck, RefreshCw, Unplug } from "lucide-react";
import { PageHeader, Panel, Button, Badge, Dialog } from "../shared/UI";
import { loadAgentConnections, revokeAgentConnection, revokeAllAgentConnections } from "../api/agentConnections";
import type { AgentSettings, AgentConnection } from "../api/agentConnections";
import "./agent-connections.css";
const guides = {
  Claude: ["Mở Customize → Connectors → Add custom connector.", "Đặt tên VJU LMS, dán link MCP. Chọn đăng nhập OAuth và Register automatically.", "Đăng nhập tài khoản LMS trên trang cấp quyền, chọn quyền đọc và tạo nháp.", "Quay lại cuộc trò chuyện, bật connector VJU LMS để sử dụng."],
  ChatGPT: ["Mở Plugins → thêm custom MCP server; giao diện cũ có thể ở Settings → Apps → Create.", "Đặt tên VJU LMS, dán link MCP và chọn OAuth. Nếu có ô scopes, nhập lms:read lms:draft; thêm lms:publish nếu muốn cho phép công bố.", "Hoàn tất đăng nhập và cấp quyền tại LMS, rồi chọn plugin VJU LMS trong chat.", "Nếu yêu cầu Client ID/Client Secret, liên hệ người quản trị để đăng ký đúng callback. Không nhập mật khẩu LMS vào ô Client Secret."],
  Gemini: ["Mở Gemini web → Settings → Connected Apps → Custom apps.", "Thêm ứng dụng bằng link MCP và chọn Next. Server hỗ trợ đăng ký client tự động.", "Đăng nhập và cấp quyền trên trang LMS.", "Quay lại chat, gõ @ để chọn ứng dụng VJU LMS."],
};
const sources = {
  Claude: "https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp",
  ChatGPT: "https://developers.openai.com/plugins/deploy/connect-chatgpt",
  Gemini: "https://support.google.com/gemini/answer/17209137",
};
const permission = (scope: string) => scope === "lms:read" ? "Đọc lớp và bài học" : scope === "lms:draft" ? "Tạo nội dung nháp" : scope === "lms:publish" ? "Công bố theo yêu cầu" : scope;
const date = (seconds: number) => new Date(seconds * 1000).toLocaleString("vi-VN");
export function AgentConnections() {
  const [data, setData] = useState<AgentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState<keyof typeof guides>("Claude");
  const [confirm, setConfirm] = useState<AgentConnection | "all" | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let current = true;
    setLoading(true); setData(null); setError(""); setCopied(false);
    loadAgentConnections().then(value => { if (current) setData(value); })
      .catch(e => { if (current) setError(e instanceof Error ? e.message : "Không tải được kết nối."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [revision]);
  async function copy() {
    if (!data?.mcpUrl || data.status !== "ready") return;
    try { await navigator.clipboard.writeText(data.mcpUrl); setCopied(true); setMessage("Đã sao chép link MCP."); }
    catch { setMessage("Trình duyệt không cho sao chép tự động. Chọn và sao chép link trong ô bên cạnh."); }
  }
  async function revoke() {
    if (!confirm) return;
    setSaving(true); setError("");
    try {
      if (confirm === "all") await revokeAllAgentConnections();
      else await revokeAgentConnection(confirm.id);
      setConfirm(null); setMessage("Đã thu hồi quyền kết nối. Ứng dụng AI cần được cấp quyền lại để tiếp tục."); setRevision(value => value + 1);
    } catch (e) { setError(e instanceof Error ? e.message : "Chưa thu hồi được kết nối. Hãy thử lại."); }
    finally { setSaving(false); }
  }
  return <>
    <PageHeader title="Kết nối agent AI" description="Kết nối trợ lý AI cá nhân với các lớp bạn phụ trách." action={<Button variant="secondary" disabled={loading || saving} onClick={() => setRevision(value => value + 1)}><RefreshCw size={16}/> Làm mới</Button>}/>
    <div className="agent-settings">
      <Panel title="Link MCP của hệ thống">
        <div className="agent-panel-intro"><Link2 size={20}/><p>Dùng cùng một link cho Claude, ChatGPT và Gemini. Mỗi giảng viên đăng nhập và cấp quyền bằng tài khoản riêng.</p></div>
        {loading ? <p role="status">Đang kiểm tra dịch vụ kết nối…</p> : data?.status === "ready" && data.mcpUrl ? <>
          <label className="agent-url-label" htmlFor="agent-mcp-url">Link để thêm vào ứng dụng AI</label>
          <div className="agent-copy-row"><input id="agent-mcp-url" value={data.mcpUrl} readOnly onFocus={event => event.currentTarget.select()}/><Button onClick={() => void copy()}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? "Đã sao chép" : "Sao chép link"}</Button></div>
          <p className="muted">Link không chứa mật khẩu. Sau khi thêm link, ứng dụng AI sẽ đưa bạn đến trang LMS để đăng nhập và cấp quyền.</p>
        </> : !error && <div className="agent-notice" role="status"><strong>{data?.status === "unavailable" ? "Dịch vụ đang gián đoạn" : "Chưa có link MCP khả dụng"}</strong><p>{data?.message}</p><p>Chọn Làm mới sau khi người quản trị bật dịch vụ. Nếu dùng link tạm, hãy sao chép lại khi link thay đổi.</p></div>}
      </Panel>
      {error && <div className="agent-error" role="alert">{error}<Button variant="secondary" disabled={loading || saving} onClick={() => { setConfirm(null); setRevision(value => value + 1); }}>Thử lại</Button></div>}
      {message && <p role="status" className="agent-message">{message}</p>}
      <div className="agent-guide-grid">
        <Panel title="Cách kết nối">
          <div className="agent-platforms" aria-label="Chọn ứng dụng AI">{(Object.keys(guides) as (keyof typeof guides)[]).map(name => <button key={name} type="button" aria-pressed={platform === name} className={platform === name ? "active" : ""} onClick={() => setPlatform(name)}>{name}</button>)}</div>
          <ol className="agent-steps">{guides[platform].map(step => <li key={step}>{step}</li>)}</ol>
          <p className="muted">{platform === "Gemini" ? "Google hiện giới hạn custom apps theo tài khoản và khu vực, gồm điều kiện tài khoản cá nhân từ 18 tuổi tại Mỹ. Tài khoản ở Việt Nam có thể chưa có mục này." : platform === "ChatGPT" ? "Quyền thêm custom MCP phụ thuộc gói tài khoản và chính sách workspace. Nếu không có nút thêm, liên hệ quản trị viên workspace." : "Nếu dùng tài khoản tổ chức, có thể cần quản trị viên thêm connector trước."}</p>
          <a className="text-link" href={sources[platform]} target="_blank" rel="noreferrer">Hướng dẫn chính thức của {platform} ↗</a>
        </Panel>
        <Panel title="Bạn đang cấp quyền gì?">
          <div className="agent-panel-intro"><ShieldCheck size={22}/><p>Agent chỉ làm việc trong phạm vi lớp bạn được phân công.</p></div>
          <ul className="agent-permissions"><li>Đọc danh sách lớp và bài học của bạn.</li><li>Tạo bài giảng, câu hỏi và bài tập nháp.</li><li>Có thể cấp thêm quyền công bố khi bạn yêu cầu rõ ràng.</li></ul>
          <p className="muted">Quyền tạo nháp không bao gồm công bố. Muốn agent công bố, cấp riêng quyền Công bố theo yêu cầu; bài giảng vẫn cần duyệt hết câu hỏi. Không cấp quyền chấm điểm, mở đáp án hoặc xem danh tính sinh viên. Nội dung trả về cho agent được chia sẻ với ứng dụng AI bạn chọn.</p>
          <blockquote className="agent-example">“Xem các lớp tôi phụ trách và tạo bài giảng nháp REST API gồm 3 trang, kèm 5 câu trắc nghiệm để tôi duyệt.”</blockquote>
        </Panel>
      </div>
      <Panel title="Ứng dụng đã được cấp quyền" action={<Button variant="secondary" disabled={loading || saving || !data?.connections.length} onClick={() => setConfirm("all")}>Thu hồi tất cả</Button>}>
        {loading ? <p role="status">Đang tải kết nối…</p> : data && (data.status === "ready" || data.status === "local" || data.status === "disabled") ? data.connections.length ? <ul className="agent-connections">{data.connections.map(connection => <li key={connection.id}><div><h3>{connection.clientName}</h3><div className="agent-scope-tags">{connection.scopes.map(scope => <Badge key={scope}>{permission(scope)}</Badge>)}</div><p className="muted">Cấp lúc {date(connection.createdAt)} · Hết hạn {date(connection.expiresAt)}</p></div><Button variant="secondary" disabled={saving} onClick={() => setConfirm(connection)}><Unplug size={16}/>Thu hồi</Button></li>)}</ul> : <div className="agent-empty"><Unplug size={24}/><h3>Chưa có ứng dụng được cấp quyền</h3><p>Sao chép link ở trên, thêm vào ứng dụng AI và hoàn tất đăng nhập. Sau đó chọn Làm mới để thấy kết nối tại đây.</p></div> : <p className="muted">Chưa tải được trạng thái các kết nối. Không có thay đổi quyền nào được thực hiện.</p>}
      </Panel>
    </div>
    {confirm && <Dialog title={confirm === "all" ? "Thu hồi tất cả kết nối?" : `Thu hồi kết nối ${confirm.clientName}?`} onClose={() => { if (!saving) setConfirm(null); }}><p>Ứng dụng sẽ không thể tiếp tục dùng quyền đã cấp. Muốn sử dụng lại, bạn cần kết nối và cấp quyền lại.</p><p className="muted">Nội dung đã tạo vẫn được giữ trong LMS. Thao tác đã gửi đến máy chủ trước khi thu hồi có thể đã hoàn tất.</p><div className="agent-dialog-actions"><Button variant="secondary" disabled={saving} onClick={() => setConfirm(null)}>Hủy</Button><Button disabled={saving} onClick={() => void revoke()}>{saving ? "Đang thu hồi…" : "Xác nhận thu hồi"}</Button></div></Dialog>}
  </>;
}
