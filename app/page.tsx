'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  useAccount, 
  useWriteContract, 
  useReadContract 
} from 'wagmi';
import { ethers } from 'ethers';

const MEMO_ADDRESS = '0x5294E9927c3306DcBaDb03fe70b92e01cCede505';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';

const MEMO_ABI = [
  {
    name: 'memo',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'data', type: 'bytes' },
      { name: 'memoId', type: 'bytes32' },
      { name: 'memoData', type: 'bytes' }
    ],
    outputs: [],
  },
] as const;

export default function MemoArcSender() {
  const { isConnected, address } = useAccount();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('1');
  const [memoText, setMemoText] = useState('Тестовое сообщение от Memo Arc Sender');
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [formattedBalance, setFormattedBalance] = useState('0.0000');

  const { writeContractAsync } = useWriteContract();

  // Баланс USDC
  const { data: balanceData } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
  });

  useEffect(() => {
    if (balanceData) {
      const formatted = Number(ethers.formatUnits(balanceData as bigint, 6)).toFixed(4);
      setFormattedBalance(formatted);
    } else {
      setFormattedBalance('0.0000');
    }
  }, [balanceData]);

  const sendWithMemo = async () => {
    if (!recipient || !amount || !address) {
      return alert('Заполни все поля');
    }

    setLoading(true);
    setTxHash('');

    try {
      const amountWei = ethers.parseUnits(amount, 6);
      const memoId = ethers.id(`memo-${Date.now()}`);
      const memoBytes = ethers.toUtf8Bytes(memoText);

      const transferData = new ethers.Interface([
        "function transfer(address to, uint256 amount)"
      ]).encodeFunctionData("transfer", [recipient, amountWei]);

      const hash = await writeContractAsync({
        address: MEMO_ADDRESS as `0x${string}`,
        abi: MEMO_ABI,
        functionName: 'memo',
        args: [
          USDC_ADDRESS as `0x${string}`,
          transferData,
          memoId,
          memoBytes
        ],
      });

      setTxHash(hash);
      alert('✅ Транзакция отправлена в сеть!');

    } catch (e: any) {
      console.error(e);
      alert('❌ ' + (e.shortMessage || e.message || 'Ошибка отправки'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-10 shadow-2xl border border-slate-700">
        <div className="text-center mb-10">
          <div className="inline-block bg-cyan-500/10 text-cyan-400 text-6xl mb-4 p-4 rounded-2xl">📝</div>
          <h1 className="text-5xl font-bold tracking-tight">Memo Arc Sender</h1>
          <p className="text-slate-400 mt-3 text-lg">Быстрая отправка USDC с memo на Arc Testnet</p>
        </div>

        <div className="flex justify-center mb-8">
          <ConnectButton label="Подключить кошелёк" showBalance={true} />
        </div>

        {isConnected && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-center">
              <p className="text-slate-400 text-sm">Баланс USDC</p>
              <p className="text-4xl font-semibold text-cyan-400 mt-1">
                {formattedBalance} 
                <span className="text-2xl text-slate-400 ml-2">USDC</span>
              </p>
            </div>

            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Адрес получателя (0x...)"
              className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-5 py-4 focus:border-cyan-500 focus:outline-none text-white"
            />

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              placeholder="Сумма"
              className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-5 py-4 focus:border-cyan-500 focus:outline-none text-white"
            />

            <textarea
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              placeholder="Сообщение в memo..."
              className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-5 py-4 h-32 focus:border-cyan-500 focus:outline-none text-white resize-y"
            />

            <button
              onClick={sendWithMemo}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 py-4 rounded-2xl font-semibold text-xl transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/30"
            >
              {loading ? 'Отправляем...' : 'Отправить USDC с Memo'}
            </button>

            {txHash && (
              <div className="text-center pt-4">
                <a 
                  href={`https://testnet.arcscan.app/tx/${txHash}`} 
                  target="_blank" 
                  className="text-cyan-400 hover:text-cyan-300 text-sm break-all"
                >
                  {txHash}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
