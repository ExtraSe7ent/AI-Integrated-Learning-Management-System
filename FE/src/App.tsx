import { BrowserRouter, Navigate, Route, Routes, Link } from "react-router-dom";
import { DemoProvider } from "./data/DemoProvider";
import { Layout } from "./shared/Layout";
import { TongQuan } from "./Sinhvien/TongQuan";
import { KhoaHoc, ChiTietKhoaHoc } from "./Sinhvien/KhoaHoc";
import { TuHoc } from "./Sinhvien/TuHoc";
import { HocBai } from "./Sinhvien/HocBai";
import { BaiTap, LamBai, KetQua } from "./Sinhvien/BaiTap";
import { TongQuanGiangVien } from "./Giangvien/TongQuan";
import { BaiHoc, SoanBai } from "./Giangvien/BaiHoc";
import { PhienTuHoc } from "./Giangvien/PhienTuHoc";
import { CauHoi } from "./Giangvien/CauHoi";
import { BaiTapGiangVien, TaoBaiTap, ChamBai } from "./Giangvien/BaiTap";
import { TheoDoi, PhucKhao } from "./Giangvien/TheoDoi";
import { PhanHoi, TaiLieu, TroLyAI } from "./shared/Communication";
import { DangNhap, DoiMatKhau, HoSo } from "./shared/Account";
import { DiemSo } from "./shared/Grades";
import { LopTrucTiep } from "./shared/LopTrucTiep";
import { Empty } from "./shared/UI";
import { AccountProvider, useAccount } from "./shared/AccountProvider";
import { accountHome } from "./data/accounts";
import type { Role } from "./data/fixtures";
import { DeanLayout } from "./Truongkhoa/Layout";
import { DeanOverview } from "./Truongkhoa/Overview";
import { DeanCourses, DeanCourseDetail } from "./Truongkhoa/Courses";
import { DeanClassDetail } from "./Truongkhoa/ClassDetail";
import { DeanAlerts } from "./Truongkhoa/Alerts";
import { DeanProfile } from "./Truongkhoa/Profile";
import { LeaderLayout } from "./Truongnhomhp/Layout";
import { LeaderOverview, LeaderClass } from "./Truongnhomhp/Overview";
import { LeaderReview, LeaderRequests } from "./Truongnhomhp/Review";
import { LeaderCompare } from "./Truongnhomhp/Compare";
import { LeaderMaterials, LeaderEditor } from "./Truongnhomhp/Materials";
import { LeaderResources } from "./Truongnhomhp/Resources";
import { LeaderProfile } from "./Truongnhomhp/Profile";
function AccountLayout({ role }: { role: Role }) {
  const { account } = useAccount();
  if (!account) return <Navigate to="/dang-nhap" replace />;
  if (account.role !== role)
    return <Navigate to={accountHome(account.role)} replace />;
  if (role === "truong-nhom-hp") return <LeaderLayout />;
  return role === "truong-khoa" ? <DeanLayout /> : <Layout />;
}
export default function App() {
  return (
    <DemoProvider>
      <AccountProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dang-nhap" replace />} />
            <Route path="/dang-nhap" element={<DangNhap />} />
            <Route path="/doi-mat-khau" element={<DoiMatKhau />} />
            <Route
              path="/truong-nhom-hp"
              element={<AccountLayout role="truong-nhom-hp" />}
            >
              <Route index element={<Navigate to="tong-quan" replace />} />
              <Route path="tong-quan" element={<LeaderOverview />} />
              <Route
                path="chuan-hoa"
                element={<LeaderOverview standardization />}
              />
              <Route path="chuan-hoa/:classId" element={<LeaderClass />} />
              <Route
                path="chuan-hoa/:classId/hoc-lieu/:itemId"
                element={<LeaderReview />}
              />
              <Route path="so-sanh" element={<LeaderCompare />} />
              <Route path="yeu-cau" element={<LeaderRequests />} />
              <Route path="hoc-lieu" element={<LeaderMaterials />} />
              <Route path="hoc-lieu/tao" element={<LeaderEditor />} />
              <Route path="hoc-lieu/:itemId/sua" element={<LeaderEditor />} />
              <Route path="tai-lieu" element={<LeaderResources />} />
              <Route path="ho-so" element={<LeaderProfile />} />
            </Route>
            <Route
              path="/truong-khoa"
              element={<AccountLayout role="truong-khoa" />}
            >
              <Route index element={<Navigate to="tong-quan" replace />} />
              <Route path="tong-quan" element={<DeanOverview />} />
              <Route path="hoc-phan" element={<DeanCourses />} />
              <Route path="hoc-phan/:courseId" element={<DeanCourseDetail />} />
              <Route
                path="hoc-phan/:courseId/lop/:classId"
                element={<DeanClassDetail />}
              />
              <Route path="canh-bao" element={<DeanAlerts />} />
              <Route path="ho-so" element={<DeanProfile />} />
            </Route>
            <Route
              path="/sinh-vien"
              element={<AccountLayout role="sinh-vien" />}
            >
              <Route index element={<Navigate to="tong-quan" replace />} />
              <Route path="tong-quan" element={<TongQuan />} />
              <Route path="khoa-hoc" element={<KhoaHoc />} />
              <Route path="khoa-hoc/:id" element={<ChiTietKhoaHoc />} />
              <Route path="tu-hoc" element={<TuHoc />} />
              <Route path="hoc/:id" element={<HocBai />} />
              <Route path="bai-tap" element={<BaiTap />} />
              <Route path="lam-bai" element={<LamBai />} />
              <Route path="ket-qua" element={<KetQua />} />
              <Route path="luyen-tap" element={<LamBai practice />} />
              <Route path="tren-lop" element={<LopTrucTiep />} />
              <Route path="diem-so" element={<DiemSo />} />
              <Route path="tro-ly-ai" element={<TroLyAI />} />
              <Route path="tai-lieu" element={<TaiLieu />} />
              <Route path="phan-hoi" element={<PhanHoi />} />
              <Route path="ho-so" element={<HoSo />} />
              <Route
                path="thong-bao"
                element={
                  <Navigate
                    to="/sinh-vien/tong-quan"
                    replace
                    state={{ notifications: true }}
                  />
                }
              />
            </Route>
            <Route
              path="/giang-vien"
              element={<AccountLayout role="giang-vien" />}
            >
              <Route index element={<Navigate to="tong-quan" replace />} />
              <Route path="tong-quan" element={<TongQuanGiangVien />} />
              <Route path="lop-hoc" element={<KhoaHoc teacher />} />
              <Route path="lop-hoc/:id" element={<ChiTietKhoaHoc teacher />} />
              <Route path="bai-hoc" element={<BaiHoc />} />
              <Route path="soan-bai" element={<SoanBai />} />
              <Route path="phien-tu-hoc" element={<PhienTuHoc />} />
              <Route path="ngan-hang-cau-hoi" element={<CauHoi />} />
              <Route path="bai-tap" element={<BaiTapGiangVien />} />
              <Route path="tao-bai-tap" element={<TaoBaiTap />} />
              <Route path="cham-bai" element={<ChamBai />} />
              <Route path="tren-lop" element={<LopTrucTiep teacher />} />
              <Route path="tien-do" element={<TheoDoi />} />
              <Route path="diem-so" element={<DiemSo teacher />} />
              <Route path="phan-hoi" element={<PhanHoi teacher />} />
              <Route path="phuc-khao" element={<PhucKhao />} />
              <Route path="tro-ly-ai" element={<TroLyAI teacher />} />
              <Route path="tai-lieu" element={<TaiLieu teacher />} />
              <Route path="ho-so" element={<HoSo teacher />} />
              <Route
                path="thong-bao"
                element={
                  <Navigate
                    to="/giang-vien/tong-quan"
                    replace
                    state={{ notifications: true }}
                  />
                }
              />
            </Route>
            <Route
              path="*"
              element={
                <Empty
                  title="Không tìm thấy trang"
                  description="Địa chỉ này không tồn tại."
                  action={
                    <Link className="button" to="/">
                      Về tổng quan
                    </Link>
                  }
                />
              }
            />
          </Routes>
        </BrowserRouter>
      </AccountProvider>
    </DemoProvider>
  );
}
