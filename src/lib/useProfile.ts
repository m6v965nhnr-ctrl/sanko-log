"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyProfile } from "@/lib/auth";
import type { Profile, Role } from "@/lib/types";

// ログイン必須のページで使う。requireRoleを指定すると、違う役割の人は振り分け先へ
export function useProfile(requireRole?: Role) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    (async () => {
      const p = await getMyProfile();
      if (!active) return;
      if (!p) {
        router.replace("/login");
        return;
      }
      if (requireRole && p.role !== requireRole) {
        router.replace(p.role === "teacher" ? "/teacher" : "/student");
        return;
      }
      setProfile(p);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { profile, loading: profile === undefined };
}
