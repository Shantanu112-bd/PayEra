"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, Avatar, AvatarImage, AvatarFallback, Button } from "@cryptopay/ui";
import { useAppStore } from "../../lib/store";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { KycOnboarding } from "@/components/kyc/KycOnboarding";

export default function ProfilePage() {
  const { setCurrentUser } = useAppStore();
  const router = useRouter();
  const [showKyc, setShowKyc] = React.useState(false);

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["current-user-profile"],
    queryFn: () => cryptoPaySdk.auth.getCurrentUser()
  });

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/");
  };

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences.</p>
      </div>

      <Card>
        <CardContent className="p-6 flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=cryptopay" />
            <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user?.displayName || "Demo User"}</h2>
            <p className="text-muted-foreground">{user?.email || "demo.user@example.com"}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline">Edit Profile</Button>
            </div>
          </div>
          <div className="ml-auto flex flex-col items-end gap-2 border-l pl-6 border-gray-200">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            ) : (user?.kycStatus === "VERIFIED" || user?.kycStatus === "APPROVED") ? (
              <div className="flex flex-col items-center justify-center p-3 bg-green-50 rounded-lg border border-green-200 text-green-700">
                <ShieldCheck className="w-6 h-6 mb-1" />
                <span className="text-sm font-bold">KYC Verified</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-700">
                <ShieldAlert className="w-6 h-6 mb-1" />
                <span className="text-sm font-bold mb-2">KYC Required</span>
                <Button size="sm" onClick={() => setShowKyc(true)}>Start KYC</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative p-4 shadow-xl">
            <button 
              onClick={() => { setShowKyc(false); refetch(); }}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200"
            >
              ✕
            </button>
            <KycOnboarding onClose={() => { setShowKyc(false); refetch(); }} />
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div>
              <p className="font-medium">Freighter Wallet</p>
              <p className="text-sm text-muted-foreground">Primary Wallet • GABCD...123</p>
            </div>
            <Button variant="outline" size="sm" className="text-red-500 border-red-500/20 hover:bg-red-500/10">Disconnect</Button>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4">
        <Button variant="destructive" onClick={handleLogout}>Log Out</Button>
      </div>
    </div>
  );
}
