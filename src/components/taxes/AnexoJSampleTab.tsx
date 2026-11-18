import React, { useMemo, useState } from 'react';
import { Download, FileText, Sparkles } from 'lucide-react';
import { tr, useAppPreferences } from '../../utils/i18n';
import { computeYearsBetween, getPortugalHoldingDiscount } from './taxToolkitHelpers';

export const AnexoJSampleTab: React.FC = () => {
  const { lang } = useAppPreferences();

  // Interactive Quadro 9.2A generator state
  const [assetLabel, setAssetLabel] = useState('VWCE.DE (UCITS ETF Acc)');
  const [codigo, setCodigo] = useState<'G20' | 'G01'>('G20');
  const [paisFonte, setPaisFonte] = useState('372 (Irlanda)');
  const [buyDate, setBuyDate] = useState('2021-04-15');
  const [buyPrice, setBuyPrice] = useState<number>(6000);
  const [sellDate, setSellDate] = useState('2026-06-20');
  const [sellPrice, setSellPrice] = useState<number>(9400);
  const [commission, setCommission] = useState<number>(4);

  const userRowMath = useMemo(() => {
    const yearsHeld = computeYearsBetween(buyDate, sellDate);
    const tier = getPortugalHoldingDiscount(yearsHeld, lang);
    const grossGain = sellPrice - buyPrice - commission;
    const taxableGain = grossGain > 0 ? grossGain * (1 - tier.discountPct / 100) : grossGain;
    const taxDue = grossGain > 0 ? grossGain * (tier.effectiveRatePct / 100) : 0;

    return {
      yearsHeld,
      tier,
      grossGain,
      taxableGain,
      taxDue,
    };
  }, [buyDate, sellDate, buyPrice, sellPrice, commission, lang]);

  const handleDownloadAnexoJHtml = () => {
    const paisCode = paisFonte.split(' ')[0] || '372';
    const isEn = lang === 'en';
    const htmlDoc = `<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'ru'}">
<head>
  <meta charset="UTF-8" />
  <title>${isEn ? 'Sample Template IRS Modelo 3 — Anexo J (Portugal)' : 'Памятка-образец IRS Modelo 3 — Anexo J (Portugal)'}</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; color: #0f172a; background: #ffffff; max-width: 960px; margin: 32px auto; padding: 0 20px; line-height: 1.5; }
    h1 { font-size: 22px; color: #1f7a53; border-bottom: 2px solid #2d8a61; padding-bottom: 8px; }
    h2 { font-size: 16px; margin-top: 24px; color: #0f172a; }
    .meta { background: #f4f7f5; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; font-size: 13px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background: #eff8f3; color: #1a6244; font-weight: 700; }
    .user-row { background: #fffbeb; font-weight: 600; }
    .note { margin-top: 16px; padding: 12px; background: #fef3c7; border-left: 4px solid #d97706; font-size: 12px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px;">
    <button onclick="window.print()" style="background:#2d8a61;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer;">🖨️ ${isEn ? 'Print / Save as PDF' : 'Распечатать / Сохранить в PDF'}</button>
  </div>
  <h1>${isEn ? 'IRS Modelo 3 — Anexo J: Filled Sample (Portugal)' : 'IRS Modelo 3 — Anexo J: Образец заполнения (Португалия)'}</h1>
  <div class="meta">
    <strong>${isEn ? 'Taxpayer (fictional sample):' : 'Налогоплательщик (образец):'}</strong> João Silva &nbsp;|&nbsp; <strong>NIF:</strong> 245 890 123 &nbsp;|&nbsp; <strong>${isEn ? 'Filing Window:' : 'Срок подачи:'}</strong> ${isEn ? 'April 1 – June 30' : '1 апреля – 30 июня'}<br/>
    <strong>${isEn ? 'Important:' : 'Важно:'}</strong> ${isEn ? 'If you only bought Acc ETFs during the tax year and sold nothing, Quadro 9.2A is not required!' : 'Если в отчётном году вы только покупали Acc ETF и не продавали их — Quadro 9.2A не заполняется!'}
  </div>

  <h2>Quadro 9.2A — Alienação Onerosa de Partes Sociais e Outros Valores Mobiliários (${isEn ? 'ETF & Stock Sales' : 'Продажи ETF и акций'})</h2>
  <table>
    <thead>
      <tr>
        <th>Linha</th>
        <th>${isEn ? 'Asset (Reference)' : 'Актив (справочно)'}</th>
        <th>País da Fonte</th>
        <th>Código</th>
        <th>Data Realização</th>
        <th>Valor Realização (€)</th>
        <th>Data Aquisição</th>
        <th>Valor Aquisição (€)</th>
        <th>Despesas (€)</th>
        <th>${isEn ? 'Lei 31/2024 Discount' : 'Льгота Lei 31/2024'}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>901</td>
        <td>VWCE.DE (Vanguard All-World Acc)</td>
        <td>372 (Irlanda)</td>
        <td>G20</td>
        <td>2026-06-15</td>
        <td>13,840.00</td>
        <td>2020-05-10</td>
        <td>9,200.00</td>
        <td>4.00</td>
        <td>${isEn ? '20% off (>5y → 22.4%)' : '20% скидка (>5 лет → 22.4%)'}</td>
      </tr>
      <tr>
        <td>902</td>
        <td>NVDA (NVIDIA Corp.)</td>
        <td>840 (EUA)</td>
        <td>G01</td>
        <td>2026-09-20</td>
        <td>4,500.00</td>
        <td>2023-03-12</td>
        <td>1,800.00</td>
        <td>2.50</td>
        <td>${isEn ? '10% off (3.5y → 25.2%)' : '10% скидка (3.5 года → 25.2%)'}</td>
      </tr>
      <tr class="user-row">
        <td>903 (${isEn ? 'Your Row' : 'Ваша строка'})</td>
        <td>${assetLabel}</td>
        <td>${paisCode}</td>
        <td>${codigo}</td>
        <td>${sellDate}</td>
        <td>${sellPrice.toFixed(2)}</td>
        <td>${buyDate}</td>
        <td>${buyPrice.toFixed(2)}</td>
        <td>${commission.toFixed(2)}</td>
        <td>${userRowMath.tier.discountPct}% (${userRowMath.yearsHeld.toFixed(1)}y → ${userRowMath.tier.effectiveRatePct}% | ~€${userRowMath.taxDue.toFixed(2)})</td>
      </tr>
    </tbody>
  </table>

  <h2>Quadro 8A — Rendimentos de Capitais (${isEn ? 'Only if cash dividends received' : 'Только если получали кэш-дивиденды'})</h2>
  <table>
    <thead>
      <tr>
        <th>Linha</th>
        <th>Código</th>
        <th>País da Fonte</th>
        <th>Rendimento Bruto (€)</th>
        <th>Imposto Pago no Estrangeiro (€)</th>
        <th>${isEn ? 'Notes' : 'Комментарий'}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>801</td>
        <td>E11 / E10</td>
        <td>840 (EUA) / 372 (IE)</td>
        <td>120.00</td>
        <td>18.00</td>
        <td>${isEn ? 'Sample for Dist ETF or dividend stocks. Empty for Acc ETFs!' : 'Пример для Dist ETF или акций с дивидендами. Для Acc ETF здесь пусто!'}</td>
      </tr>
    </tbody>
  </table>

  <h2>Quadro 11 — Contas de Depósito ou de Títulos Abertas no Estrangeiro</h2>
  <p style="font-size:13px;">${isEn ? 'Declare the IBAN of any foreign brokerage account (DEGIRO/flatexDEGIRO, Interactive Brokers IE/HU, XTB Poland, Trading 212) held outside Portugal.' : 'Обязательно укажите IBAN иностранного брокерского счёта (DEGIRO/flatexDEGIRO, Interactive Brokers Ireland/Hungary, XTB Poland, Trading 212), если счёт открыт за пределами Португалии.'}</p>

  <div class="note">
    <strong>${isEn ? 'Disclaimer:' : 'Отказ от ответственности:'}</strong> ${isEn ? 'Generated by EuroETF Compass for educational purposes only. Verify official codes (G01/G20, E10/E11) on Portal das Finanças or with a certified Contabilista Certificado.' : 'Этот шаблон сформирован в EuroETF Compass исключительно в образовательных целях. Проверяйте актуальные коды (G01/G20, E10/E11) на Portal das Finanças или у сертифицированного Contabilista Certificado.'}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IRS-Anexo-J-Template-${sellDate}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-5">
      <div className="flex flex-col gap-3 border-b ui-border-subtle pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 ui-text-sage" />
            <h3 className="text-base font-bold ui-text-primary sm:text-lg">
              {tr(
                lang,
                'Filled Sample: Portugal IRS Modelo 3 — Anexo J',
                'Заполненный образец португальской формы IRS Modelo 3 — Anexo J'
              )}
            </h3>
          </div>
          <p className="mt-1 text-xs ui-text-muted">
            {tr(
              lang,
              'Fictional Portugal tax resident example:',
              'Пример для вымышленного резидента Португалии:'
            )}{' '}
            <span className="font-semibold ui-text-secondary">João Silva, NIF 245 890 123</span>{' '}
            {tr(
              lang,
              '(foreign broker outside Portugal, e.g., IBKR / DEGIRO / XTB).',
              '(брокер за пределами Португалии, например IBKR / DEGIRO / XTB).'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadAnexoJHtml}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600"
        >
          <Download className="h-4 w-4" />
          <span>
            {tr(
              lang,
              'Download Anexo J Cheat-Sheet (.html / Print PDF)',
              'Скачать шаблон Anexo J (.html / Печать в PDF)'
            )}
          </span>
        </button>
      </div>

      {/* Quadro 9.2A Table */}
      <div className="mt-4">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider ui-text-sage">
          Quadro 9.2A — Alienação Onerosa de Partes Sociais e Outros Valores Mobiliários (
          {tr(lang, 'Sales', 'Продажи')})
        </h4>
        <div className="overflow-x-auto rounded-xl border ui-border-subtle">
          <table className="w-full min-w-[820px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b ui-border-subtle ui-surface-card text-[11px] font-semibold ui-text-body">
                <th className="px-3 py-2.5">Linha</th>
                <th className="px-3 py-2.5">{tr(lang, 'Asset (Ref.)', 'Актив (справочно)')}</th>
                <th className="px-3 py-2.5">País da Fonte</th>
                <th className="px-3 py-2.5">Código</th>
                <th className="px-3 py-2.5">Data Realização</th>
                <th className="px-3 py-2.5 text-right">Valor Realização</th>
                <th className="px-3 py-2.5">Data Aquisição</th>
                <th className="px-3 py-2.5 text-right">Valor Aquisição</th>
                <th className="px-3 py-2.5 text-right">Despesas</th>
                <th className="px-3 py-2.5">
                  {tr(lang, 'Lei n.º 31/2024 Tier', 'Льгота Lei n.º 31/2024')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ui-border-subtle)] ui-surface-deep">
              <tr>
                <td className="px-3 py-2.5 font-mono font-bold ui-text-sage">901</td>
                <td className="px-3 py-2.5 font-semibold ui-text-primary">
                  VWCE.DE (Vanguard All-World Acc)
                </td>
                <td className="px-3 py-2.5 font-mono ui-text-body">372 (Irlanda)</td>
                <td className="px-3 py-2.5 font-mono ui-text-cool">G20 (ETF/UP)</td>
                <td className="px-3 py-2.5 font-mono ui-text-secondary">2026-06-15</td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold ui-text-primary">
                  €13,840.00
                </td>
                <td className="px-3 py-2.5 font-mono ui-text-secondary">2020-05-10</td>
                <td className="px-3 py-2.5 text-right font-mono ui-text-secondary">€9,200.00</td>
                <td className="px-3 py-2.5 text-right font-mono ui-text-muted">€4.00</td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold ui-text-sage">
                    {tr(lang, '>5y → 20% off (22.4%)', '>5 лет → 20% скидка (22.4%)')}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-mono font-bold ui-text-sage">902</td>
                <td className="px-3 py-2.5 font-semibold ui-text-primary">NVDA (NVIDIA Corp.)</td>
                <td className="px-3 py-2.5 font-mono ui-text-body">840 (EUA)</td>
                <td className="px-3 py-2.5 font-mono ui-text-cool">G01 (Ações)</td>
                <td className="px-3 py-2.5 font-mono ui-text-secondary">2026-09-20</td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold ui-text-primary">
                  €4,500.00
                </td>
                <td className="px-3 py-2.5 font-mono ui-text-secondary">2023-03-12</td>
                <td className="px-3 py-2.5 text-right font-mono ui-text-secondary">€1,800.00</td>
                <td className="px-3 py-2.5 text-right font-mono ui-text-muted">€2.50</td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold ui-text-cool">
                    {tr(lang, '3.5y → 10% off (25.2%)', '3.5 года → 10% скидка (25.2%)')}
                  </span>
                </td>
              </tr>
              {/* User Generated Live Row */}
              <tr className="ui-tint-sand">
                <td className="px-3 py-2.5 font-mono font-bold ui-text-sand">903*</td>
                <td className="px-3 py-2.5 font-bold ui-text-sand">{assetLabel}</td>
                <td className="px-3 py-2.5 font-mono ui-text-secondary">{paisFonte}</td>
                <td className="px-3 py-2.5 font-mono ui-text-sand">{codigo}</td>
                <td className="px-3 py-2.5 font-mono ui-text-secondary">{sellDate}</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold ui-text-primary">
                  €{sellPrice.toLocaleString('en-IE', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2.5 font-mono ui-text-secondary">{buyDate}</td>
                <td className="px-3 py-2.5 text-right font-mono ui-text-secondary">
                  €{buyPrice.toLocaleString('en-IE', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2.5 text-right font-mono ui-text-body">
                  €{commission.toFixed(2)}
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold ui-text-sand">
                    {userRowMath.yearsHeld.toFixed(1)}
                    {tr(lang, 'y', 'л')} → {userRowMath.tier.discountPct}%{' '}
                    {tr(lang, 'off', 'скидка')} ({userRowMath.tier.effectiveRatePct}%)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Quadro 8A Example Table */}
      <div className="mt-5">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider ui-text-cool">
          Quadro 8A — Rendimentos de Capitais (
          {tr(
            lang,
            'Dividend example for Dist ETFs / stocks',
            'Пример заполнения дивидендов для Dist ETF / акций'
          )}
          )
        </h4>
        <div className="overflow-x-auto rounded-xl border ui-border-subtle">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b ui-border-subtle ui-surface-card text-[11px] font-semibold ui-text-body">
                <th className="px-3 py-2">Linha</th>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">País da Fonte</th>
                <th className="px-3 py-2 text-right">Rendimento Bruto (€)</th>
                <th className="px-3 py-2 text-right">Imposto Pago no Estrangeiro (€)</th>
                <th className="px-3 py-2">{tr(lang, 'Explanation', 'Пояснение')}</th>
              </tr>
            </thead>
            <tbody className="ui-surface-deep">
              <tr>
                <td className="px-3 py-2.5 font-mono font-bold ui-text-cool">801</td>
                <td className="px-3 py-2.5 font-mono ui-text-primary">E11 / E10</td>
                <td className="px-3 py-2.5 font-mono ui-text-body">
                  840 (EUA) / 372 (Irlanda)
                </td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold ui-text-primary">
                  €120.00
                </td>
                <td className="px-3 py-2.5 text-right font-mono ui-text-secondary">€18.00</td>
                <td className="px-3 py-2.5 text-[11px] ui-text-body">
                  {tr(
                    lang,
                    'Filled only if you received cash dividends. For Acc ETFs there are no rows in Quadro 8A!',
                    'Заполняется только если вы получали денежные дивиденды. Для Acc ETF строк в Quadro 8A нет!'
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Quadro 9.2A Row Generator */}
      <div className="mt-5 rounded-2xl border border-emerald-500/30 ui-surface-deep p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 ui-text-sage" />
            <h4 className="text-sm font-bold ui-text-primary">
              {tr(
                lang,
                'Interactive Generator: Generate Quadro 9.2A Row for Your Numbers',
                'Интерактивный генератор: «Сгенерировать строку Quadro 9.2A под мои цифры»'
              )}
            </h4>
          </div>
          <span className="text-[11px] ui-text-muted">
            {tr(
              lang,
              'Updates row 903* above and the downloadable HTML sheet',
              'Обновляет строку 903* в таблице и HTML-памятке выше'
            )}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold ui-text-muted">
              {tr(lang, 'Asset & Code Type', 'Актив и тип кода')}
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={assetLabel}
                onChange={(e) => setAssetLabel(e.target.value)}
                className="w-full rounded-lg border ui-input px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500"
              />
              <select
                aria-label="Anexo J code"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value as 'G20' | 'G01')}
                className="rounded-lg border ui-input px-2 py-1.5 font-mono text-xs font-bold outline-none focus:border-emerald-500"
              >
                <option value="G20">G20</option>
                <option value="G01">G01</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold ui-text-muted">
              {tr(
                lang,
                'País da Fonte (ETF / Stock Domicile)',
                'País da Fonte (Домициль ETF/акции)'
              )}
            </label>
            <select
              value={paisFonte}
              onChange={(e) => setPaisFonte(e.target.value)}
              className="w-full rounded-lg border ui-input px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500"
            >
              <option value="372 (Irlanda)">372 (Irlanda — VWCE, SXR8, IWDA)</option>
              <option value="442 (Luxemburgo)">442 (Luxemburgo — Amundi/LU)</option>
              <option value="840 (EUA)">840 (Estados Unidos — NVDA, AAPL)</option>
              <option value="276 (Alemanha)">276 (Alemanha — SAP, SIE)</option>
              <option value="528 (Países Baixos)">528 (Países Baixos — ASML)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold ui-text-muted">
              {tr(lang, 'Buy Date / Cost Basis (€)', 'Дата покупки / Цена покупки (€)')}
            </label>
            <div className="flex gap-1.5">
              <input
                type="date"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
                className="w-full rounded-lg border ui-input px-2 py-1.5 font-mono text-xs outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                min={0}
                step={100}
                value={buyPrice}
                onChange={(e) => setBuyPrice(Math.max(0, Number(e.target.value)))}
                className="w-24 rounded-lg border ui-input px-2 py-1.5 font-mono text-xs outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold ui-text-muted">
              {tr(
                lang,
                'Sell Date / Proceeds (€) + Fee (€)',
                'Дата продажи / Выручка (€) + Комиссия (€)'
              )}
            </label>
            <div className="flex gap-1.5">
              <input
                type="date"
                value={sellDate}
                onChange={(e) => setSellDate(e.target.value)}
                className="w-full rounded-lg border ui-input px-2 py-1.5 font-mono text-xs outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                min={0}
                step={100}
                value={sellPrice}
                onChange={(e) => setSellPrice(Math.max(0, Number(e.target.value)))}
                className="w-24 rounded-lg border ui-input px-2 py-1.5 font-mono text-xs outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                min={0}
                step={0.5}
                value={commission}
                title={tr(lang, 'Broker commission (Despesas)', 'Комиссия брокера (Despesas)')}
                onChange={(e) => setCommission(Math.max(0, Number(e.target.value)))}
                className="w-16 rounded-lg border ui-input px-2 py-1.5 font-mono text-xs outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border ui-border-subtle ui-surface-card p-3">
            <span className="text-[11px] ui-text-muted">
              {tr(lang, 'Holding Period', 'Срок владения')}
            </span>
            <p className="mt-0.5 font-mono text-base font-extrabold ui-text-primary">
              {userRowMath.yearsHeld.toFixed(2)} {tr(lang, 'yrs', 'лет')}
            </p>
            <span className="text-[10px] ui-text-muted">{userRowMath.tier.tierLabel}</span>
          </div>
          <div className="rounded-xl border ui-border-subtle ui-surface-card p-3">
            <span className="text-[11px] ui-text-muted">
              {tr(lang, 'Pre-Tax Gain', 'Прибыль до налога')}
            </span>
            <p
              className={`mt-0.5 font-mono text-base font-extrabold ${
                userRowMath.grossGain >= 0 ? 'ui-text-sage' : 'ui-text-rose'
              }`}
            >
              €{userRowMath.grossGain.toFixed(2)}
            </p>
            <span className="text-[10px] ui-text-muted">
              {tr(lang, 'Proceeds − Cost − Fees', 'Продажа − Покупка − Комиссии')}
            </span>
          </div>
          <div className="rounded-xl border ui-border-subtle ui-surface-card p-3">
            <span className="text-[11px] ui-text-muted">
              {tr(lang, 'IRS Rate (Lei n.º 31/2024)', 'Ставка IRS (Lei n.º 31/2024)')}
            </span>
            <p className="mt-0.5 font-mono text-base font-extrabold ui-text-cool">
              {userRowMath.tier.effectiveRatePct.toFixed(1)}%
            </p>
            <span className="text-[10px] ui-text-muted">
              {tr(
                lang,
                `${userRowMath.tier.discountPct}% discount off tax base`,
                `Скидка ${userRowMath.tier.discountPct}% с налоговой базы`
              )}
            </span>
          </div>
          <div className="rounded-xl border border-emerald-500/35 ui-tint-sage p-3">
            <span className="text-[11px] ui-text-sage">
              {tr(lang, 'Estimated IRS Tax', 'Расчётный налог IRS')}
            </span>
            <p className="mt-0.5 font-mono text-base font-extrabold ui-text-sage">
              €{userRowMath.taxDue.toFixed(2)}
            </p>
            <span className="text-[10px] ui-text-muted">
              {tr(lang, 'Net proceeds:', 'Чистыми на руки:')} €
              {(sellPrice - userRowMath.taxDue).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
