"use client";

export default function LogoutButton() {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-black px-4 py-2 font-semibold transition hover:bg-black hover:text-white"
    >
      Logout
    </button>
  );
}