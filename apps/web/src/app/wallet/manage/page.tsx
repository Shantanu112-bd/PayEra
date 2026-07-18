"use client";

import * as React from "react";
import { ArrowLeft, Wallet as WalletIcon, Check, Star, Trash2, Edit2, Loader2, Save, X } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cryptoPaySdk } from "@cryptopay/sdk";
import { Skeleton, Button, EmptyState } from "@cryptopay/ui";
import { Wallet } from "@cryptopay/types";

function WalletRow({ wallet, isEditing, onEditStart, onEditCancel, onEditSave, isSaving, onDisconnect, isDisconnecting, onSetPrimary, isSettingPrimary }: any) {
  const [editLabel, setEditLabel] = React.useState(wallet.label || "");

  React.useEffect(() => {
    setEditLabel(wallet.label || "");
  }, [wallet.label, isEditing]);

  const shortKey = wallet.publicKey.slice(0, 8) + "..." + wallet.publicKey.slice(-4);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl gap-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <WalletIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          {isEditing ? (
            <div className="flex items-center gap-2 mb-1">
              <input 
                type="text" 
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="bg-black border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Wallet Label"
              />
              <button onClick={() => onEditSave(wallet.id, editLabel)} disabled={isSaving} className="text-emerald-400 hover:bg-white/10 p-1 rounded">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
              <button onClick={onEditCancel} disabled={isSaving} className="text-red-400 hover:bg-white/10 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-white">{wallet.label || "Unnamed Wallet"}</span>
              <button onClick={onEditStart} className="text-muted-foreground hover:text-white transition-colors">
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
            <span>{shortKey}</span>
            {wallet.isPrimary && (
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">PRIMARY</span>
            )}
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${wallet.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-red-500/20 text-red-400 border-red-500/20'}`}>
              {wallet.status}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {!wallet.isPrimary && wallet.status === 'ACTIVE' && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onSetPrimary(wallet.id)}
            disabled={isSettingPrimary}
            className="flex-1 sm:flex-none border-white/10 hover:bg-white/5"
          >
            {isSettingPrimary ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Star className="w-4 h-4 mr-2" />}
            Make Primary
          </Button>
        )}
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => onDisconnect(wallet.id)}
          disabled={isDisconnecting}
          className="flex-1 sm:flex-none bg-red-950 text-red-400 hover:bg-red-900 border border-red-900/50"
        >
          {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

export default function WalletManagePage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const { data: walletsRes, isLoading } = useQuery({
    queryKey: ["wallets"],
    queryFn: () => cryptoPaySdk.wallets.listWallets(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Wallet> }) => cryptoPaySdk.wallets.updateWallet(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setEditingId(null);
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => cryptoPaySdk.wallets.disconnect(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    }
  });

  const wallets = walletsRes?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <Link href="/wallet" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Manage Wallets</h1>
          <p className="text-muted-foreground mt-1 text-sm">View and manage your connected Stellar wallets.</p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : wallets.length === 0 ? (
          <EmptyState 
            icon={<WalletIcon className="w-8 h-8" />} 
            title="No Wallets" 
            description="You haven't connected any wallets yet." 
          />
        ) : (
          wallets.map((wallet: Wallet) => (
            <WalletRow 
              key={wallet.id}
              wallet={wallet}
              isEditing={editingId === wallet.id}
              onEditStart={() => setEditingId(wallet.id)}
              onEditCancel={() => setEditingId(null)}
              onEditSave={(id: string, label: string) => updateMutation.mutate({ id, data: { label } })}
              isSaving={updateMutation.isPending && editingId === wallet.id}
              onSetPrimary={(id: string) => updateMutation.mutate({ id, data: { isPrimary: true } })}
              isSettingPrimary={updateMutation.isPending && updateMutation.variables?.data?.isPrimary}
              onDisconnect={(id: string) => {
                if (window.confirm("Are you sure you want to disconnect this wallet?")) {
                  disconnectMutation.mutate(id);
                }
              }}
              isDisconnecting={disconnectMutation.isPending && disconnectMutation.variables === wallet.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
