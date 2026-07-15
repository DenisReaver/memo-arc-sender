'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useChainId, useSwitchChain } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { ethers } from 'ethers';

const ARC_CHAIN_ID = 5042002;
const MEMO_ADDRESS = '0x5294E9927c3306DcBaDb03fe70b92e01cCede505';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function MemoArcSender() {
  const { isConnected, address } = useAccount();
  const { connect } = useConnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('1');
  const [memoText, setMemoText] = useState('Тестовое сообщение от Memo Arc Sender');
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState('0.000000');

  const isWrongNetwork = isConnected && chainId !== ARC_CHAIN_ID;

  // Баланс USDC
  useEffect(() => {
    if (!address || isWrongNetwork) {
      setUsdcBalance('0.000000');
      return;
    }

    const fetchBalance = async () => {
      try {
        if (!window.ethereum) return;
        const provider = new ethers.BrowserProvider(window.ethereum);
        const usdcAbi = ["function balanceOf(address account) view returns (uint256)"];
        const contract = new ethers.Contract(USDC_ADDRESS, usdcAbi, provider);
        const balance = await contract.balanceOf(address);
        setUsdcBalance(ethers.formatUnits(balance, 6));
      } catch (e) {
        console.error(e);
        setUsdcBalance('0.000000');
      }
    };

    fetchBalance();
  }, [address, isWrongNetwork]);

  const connectMetaMask = () => connect({ connector: injected() });
  const connectWalletConnect = () => connect({ connector: walletConnect({ projectId: 'da13e8b76983976be4b39ecba29072bd' }) });

  const switchToArc = async () => {
    try {
      await switchChain({ chainId: ARC_CHAIN_ID });
    } catch (e: any) {
      alert('Не удалось автоматически переключить сеть.\n\nПожалуйста, переключите вручную в MetaMask на ARC Testnet (Chain ID: 5042002)');
    }
  };

  const sendWithMemo = async () => {
    if (!recipient || !amount) return alert('Заполни все поля');

    if (isWrongNetwork) {
      alert('❌ Вы подключены не к ARC Testnet!\n\nНажмите кнопку "Переключиться на ARC Testnet" выше.');
      return;
    }

    setLoading(true);
    setTxHash('');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();

      const amountWei = ethers.parseUnits(amount, 6);

      const transferData = new ethers.Interface([
        "function transfer(address to, uint256 amount)"
      ]).encodeFunctionData("transfer", [recipient, amountWei]);

      const memoId = ethers.id(`memo-${Date.now()}`);
      const memoBytes = ethers.toUtf8Bytes(memoText);

      const memoInterface = new ethers.Interface([
        "function memo(address target, bytes data, bytes32 memoId, bytes memoData)"
      ]);

      const tx = await signer.sendTransaction({
        to: MEMO_ADDRESS,
        data: memoInterface.encodeFunctionData("memo", [USDC_ADDRESS, transferData, memoId, memoBytes]),
        gasLimit: 400000,
      });

      setTxHash(tx.hash);
      alert('✅ Транзакция отправлена!');

      const receipt = await tx.wait();
      if (receipt) alert(`🎉 Успешно! Блок: ${receipt.blockNumber}`);
    } catch (e: any) {
      console.error(e);
      alert('❌ ' + (e.shortMessage || e.message || 'Ошибка транзакции'));
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
          <p className="text-slate-400 mt-3 text-lg">USDC + Memo • ARC Testnet</p>
        </div>

        {!isConnected && (
          <div className="flex flex-col gap-4 mb-8">
            <button onClick={connectMetaMask} className="bg-orange-600 hover:bg-orange-700 py-4 rounded-2xl font-semibold text-lg transition">
              Подключить MetaMask
            </button>
            <button onClick={connectWalletConnect} className="bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-semibold text-lg transition">
              Подключить WalletConnect
            </button>
          </div>
        )}

        {isConnected && (
          <>
            {/* Кнопка переключения сети — всегда видна */}
            <div className="mb-6">
              {isWrongNetwork ? (
                <button
                  onClick={switchToArc}
                  className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-2xl font-semibold text-lg transition flex items-center justify-center gap-2"
                >
                  🔄 Переключиться на ARC Testnet (5042002)
                </button>
              ) : (
                <div className="bg-green-500/10 border border-green-500 text-green-400 py-3 rounded-2xl text-center font-medium">
                  ✅ Вы в сети ARC Testnet
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-center">
                <p className="text-slate-400 text-sm">Баланс USDC</p>
                <p className="text-4xl font-semibold text-cyan-400 mt-1">
                  {usdcBalance} <span className="text-2xl text-slate-400">USDC</span>
                </p>
              </div>

              <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Адрес получателя (0x...)" className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-5 py-4 focus:border-cyan-500 focus:outline-none text-white" />

              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} step="0.000001" placeholder="Сумма USDC" className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-5 py-4 focus:border-cyan-500 focus:outline-none text-white" />

              <textarea value={memoText} onChange={(e) => setMemoText(e.target.value)} placeholder="Сообщение в memo..." className="w-full bg-slate-800 border border-slate-600 rounded-2xl px-5 py-4 h-32 focus:border-cyan-500 focus:outline-none text-white resize-y" />

              <button
                onClick={sendWithMemo}
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 py-4 rounded-2xl font-semibold text-xl transition-all disabled:opacity-50"
              >
                {loading ? 'Отправка...' : 'Отправить USDC с Memo'}
              </button>

              {txHash && (
                <div className="text-center pt-4">
                  <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" className="text-cyan-400 hover:text-cyan-300 break-all text-sm">
                    {txHash}
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
