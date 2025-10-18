"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import type { Database } from "@/lib/supabase/database.types";
import bcrypt from "bcryptjs";

export default function AdminAuthPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const router = useRouter();

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === "ntlr1111") {
      sessionStorage.setItem("admin_verified", "true");
      setVerified(true);
      setError("");
    } else {
      setError("비밀번호가 올바르지 않습니다.");
    }
  };

  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
            Admin Access
          </h1>
          <p className="text-center text-gray-600 mb-8">
            관리자 페이지 접속을 위해 비밀번호를 입력하세요
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 bg-white"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              접속하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminLoginRegister />;
}

function AdminLoginRegister() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    instagram_id: "",
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from("profile-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Find admin by email
      const { data: adminData, error: fetchError } = await supabase
        .from("admins")
        .select("*")
        .eq("email", formData.email)
        .single();

      if (fetchError || !adminData) {
        throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
      }

      type AdminRow = Database["public"]["Tables"]["admins"]["Row"];
      const admin = adminData as AdminRow;

      // Verify password
      const passwordMatch = await bcrypt.compare(
        formData.password,
        admin.password_hash,
      );

      if (!passwordMatch) {
        throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
      }

      // Set auth state (exclude password_hash)
      const { password_hash, ...adminWithoutPassword } = admin;
      setAuth(true, adminWithoutPassword);

      router.push("/admin/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let profileImageUrl = null;

      if (profileImage) {
        profileImageUrl = await uploadProfileImage(profileImage);
        if (!profileImageUrl) {
          throw new Error("이미지 업로드에 실패했습니다.");
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(formData.password, 10);

      type AdminInsert = Database["public"]["Tables"]["admins"]["Insert"];

      const adminData: AdminInsert = {
        name: formData.name,
        email: formData.email,
        password_hash: passwordHash,
        instagram_id: formData.instagram_id || null,
        profile_image_url: profileImageUrl,
      };

      const { data: newAdminData, error: dbError } = await supabase
        .from("admins")
        .insert([adminData] as any)
        .select()
        .single();

      if (dbError) throw dbError;

      type AdminRow = Database["public"]["Tables"]["admins"]["Row"];
      const admin = newAdminData as AdminRow;

      // Set auth state (exclude password_hash)
      const { password_hash, ...adminWithoutPassword } = admin;
      setAuth(true, adminWithoutPassword);

      router.push("/admin/dashboard");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Toggle Buttons */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                mode === "login"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                mode === "register"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              회원가입
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Admin 로그인
              </h2>

              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 bg-white"
                  placeholder="example@email.com"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 bg-white"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Admin 회원가입
              </h2>

              {/* Profile Image */}
              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  프로필 이미지
                </label>
                <div className="relative">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-indigo-100">
                      <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-2 cursor-pointer hover:bg-indigo-700 transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Name */}
              <div>
                <label
                  htmlFor="register-name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  id="register-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 bg-white"
                  placeholder="홍길동"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="register-email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 bg-white"
                  placeholder="example@email.com"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="register-password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  id="register-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 bg-white"
                  placeholder="비밀번호를 입력하세요"
                  required
                  minLength={6}
                />
                <p className="text-sm text-gray-500 mt-1">
                  최소 6자 이상 입력하세요
                </p>
              </div>

              {/* Instagram ID */}
              <div>
                <label
                  htmlFor="register-instagram"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  인스타그램 ID
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                    @
                  </span>
                  <input
                    id="register-instagram"
                    type="text"
                    value={formData.instagram_id}
                    onChange={(e) =>
                      setFormData({ ...formData, instagram_id: e.target.value })
                    }
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 bg-white"
                    placeholder="username"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                {loading ? "등록 중..." : "회원가입"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
