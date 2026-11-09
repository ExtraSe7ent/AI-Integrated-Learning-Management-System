export class BackendError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export class LmsBackend {
  constructor(baseUrl) {
    this.baseUrl = new URL(baseUrl);
    if (!['http:', 'https:'].includes(this.baseUrl.protocol) || this.baseUrl.username || this.baseUrl.password || this.baseUrl.pathname !== '/') throw new Error('LMS_BACKEND_URL must be an HTTP(S) origin.');
    if (this.baseUrl.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(this.baseUrl.hostname)) throw new Error('Use HTTPS for a non-loopback backend.');
  }
  async request(path, token, {method = 'GET', body} = {}) {
    if (!path.startsWith('/api/')) throw new Error('Only LMS API paths are allowed.');
    let response;
    try {
      response = await fetch(new URL(path, this.baseUrl), {
        method, redirect: 'error', signal: AbortSignal.timeout(15000),
        headers: {...(token ? {Authorization: `Bearer ${token}`} : {}), ...(body ? {'Content-Type': 'application/json'} : {})},
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch { throw new BackendError(503, 'Không kết nối được BE. Thao tác ghi có thể đã được lưu; kiểm tra lại trước khi gửi yêu cầu mới.'); }
    if (!response.ok) {
      // Do not forward upstream HTML, stack traces or credential-bearing bodies to agents.
      throw new BackendError(response.status, ({401:'Phiên đăng nhập hết hạn hoặc thông tin đăng nhập không đúng.',403:'Không có quyền thao tác trong lớp này.',404:'Không tìm thấy nội dung.',400:'Dữ liệu không hợp lệ theo quy tắc LMS.',409:'Nội dung đã thay đổi hoặc xung đột.'})[response.status] || 'BE từ chối thao tác.');
    }
    return response.status === 204 ? null : response.json();
  }
  async login(username, password) {
    const result = await this.request('/api/auth/login', undefined, {method:'POST', body:{username, password}});
    assertLecturer(result.account);
    return result;
  }
}
export function assertLecturer(account) {
  if (!account?.id || !account.active || account.mustChange || !['giang-vien', 'truong-nhom-hp'].includes(account.role)) {
    throw new BackendError(403, 'Chỉ giảng viên/Trưởng nhóm học phần đang hoạt động, đã đổi mật khẩu bắt buộc, được kết nối MCP.');
  }
  return account;
}
