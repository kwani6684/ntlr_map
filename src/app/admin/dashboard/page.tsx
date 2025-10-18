"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import AdminGuard from "@/components/admin/AdminGuard";
import ThemeToggle from "@/components/ThemeToggle";
import type { Database } from "@/lib/supabase/database.types";

type Route = Database["public"]["Tables"]["routes"]["Row"];

interface RouteWithPlaceCount extends Route {
  place_count: number;
}

function DashboardContent() {
  const router = useRouter();
  const { admin, logout } = useAuthStore();

  const [routes, setRoutes] = useState<RouteWithPlaceCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (admin) {
      loadRoutes();
    } else {
      // If no admin is logged in, redirect to admin login
      router.push("/admin");
    }
  }, [admin, router]);

  const loadRoutes = async () => {
    if (!admin) return;

    try {
      const { data: routesData, error: routesError } = await supabase
        .from("routes")
        .select("*")
        .eq("creator_id", admin.id)
        .order("created_at", { ascending: false });

      if (routesError) throw routesError;

      const routes = (routesData || []) as Route[];

      // Count places for each route
      const routesWithCounts = await Promise.all(
        routes.map(async (route) => {
          const { count } = await supabase
            .from("places")
            .select("*", { count: "exact", head: true })
            .eq("route_id", route.id);

          return {
            ...route,
            place_count: count || 0,
          };
        }),
      );

      setRoutes(routesWithCounts);
    } catch (err) {
      console.error("Load routes error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteRoute = async (routeId: string) => {
    if (!confirm("정말로 이 동선을 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("routes")
        .delete()
        .eq("id", routeId);

      if (error) throw error;

      setRoutes(routes.filter((r) => r.id !== routeId));
      alert("동선이 삭제되었습니다.");
    } catch (err) {
      console.error("Delete error:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleLogout = () => {
    logout();
    sessionStorage.removeItem("admin_verified");
    router.push("/admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Admin Dashboard
              </h1>
              {admin && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  안녕하세요, {admin.name}님! 👋
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {admin?.profile_image_url && (
                <img
                  src={admin.profile_image_url}
                  alt={admin.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin/routes/create")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            새 동선 만들기
          </button>
        </div>

        {/* Routes List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            내 동선 ({routes.length}개)
          </h2>

          {routes.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <p className="text-gray-600 mb-4">아직 생성된 동선이 없습니다.</p>
              <button
                onClick={() => router.push("/admin/routes/create")}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                첫 동선 만들기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">
                      {route.title}
                    </h3>
                    {route.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {route.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {route.place_count}개 장소
                      </div>
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {new Date(route.created_at).toLocaleDateString("ko-KR")}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/routes/${route.id}`)}
                        className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
                      >
                        미리보기
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/admin/routes/${route.id}/edit`)
                        }
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => deleteRoute(route.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  );
}
