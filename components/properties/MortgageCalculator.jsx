'use client';

import { useState, useMemo } from 'react';
import styles from './MortgageCalculator.module.css';

export default function MortgageCalculator({ propertyPrice = 200000 }) {
  const [price, setPrice] = useState(propertyPrice);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(7.5);

  const calc = useMemo(() => {
    const downPayment = price * (downPaymentPct / 100);
    const loanAmount = price - downPayment;
    const monthlyRate = rate / 100 / 12;
    const totalPayments = years * 12;

    if (monthlyRate === 0 || totalPayments === 0) {
      return { monthly: 0, total: 0, totalInterest: 0, loanAmount, downPayment };
    }

    const monthly =
      loanAmount *
      (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1);

    const total = monthly * totalPayments;
    const totalInterest = total - loanAmount;

    return { monthly, total, totalInterest, loanAmount, downPayment };
  }, [price, downPaymentPct, years, rate]);

  const capitalPct = calc.total > 0 ? (calc.loanAmount / calc.total) * 100 : 50;
  const interestPct = 100 - capitalPct;

  const formatUSD = (n) =>
    new Intl.NumberFormat('es-AR', { style: 'decimal', maximumFractionDigits: 0 }).format(n);

  return (
    <div className={styles.calculator}>
      <h2 className={styles.title}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="2" width="16" height="20" rx="2"/>
          <line x1="8" y1="6" x2="16" y2="6"/>
          <line x1="8" y1="10" x2="10" y2="10"/>
          <line x1="14" y1="10" x2="16" y2="10"/>
          <line x1="8" y1="14" x2="10" y2="14"/>
          <line x1="14" y1="14" x2="16" y2="14"/>
          <line x1="8" y1="18" x2="16" y2="18"/>
        </svg>
        Calculadora de Hipoteca
      </h2>

      <div className={styles.inputs}>
        {/* Property Value */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Valor de la propiedad (USD)</label>
          <input
            type="number"
            className={styles.input}
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
            min={0}
            step={5000}
          />
        </div>

        {/* Down Payment */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            Anticipo: <strong>{downPaymentPct}%</strong> (USD {formatUSD(calc.downPayment)})
          </label>
          <input
            type="range"
            className={styles.range}
            value={downPaymentPct}
            onChange={e => setDownPaymentPct(Number(e.target.value))}
            min={5}
            max={80}
            step={5}
          />
          <div className={styles.rangeLabels}>
            <span>5%</span><span>80%</span>
          </div>
        </div>

        {/* Years */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Plazo: <strong>{years} años</strong></label>
          <input
            type="range"
            className={styles.range}
            value={years}
            onChange={e => setYears(Number(e.target.value))}
            min={5}
            max={30}
            step={5}
          />
          <div className={styles.rangeLabels}>
            <span>5 años</span><span>30 años</span>
          </div>
        </div>

        {/* Interest Rate */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Tasa anual: <strong>{rate}%</strong></label>
          <input
            type="range"
            className={styles.range}
            value={rate}
            onChange={e => setRate(Number(e.target.value))}
            min={1}
            max={15}
            step={0.5}
          />
          <div className={styles.rangeLabels}>
            <span>1%</span><span>15%</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className={styles.results}>
        <div className={styles.monthlyBlock}>
          <span className={styles.monthlyLabel}>Cuota mensual estimada</span>
          <span className={styles.monthlyValue}>USD {formatUSD(calc.monthly)}</span>
        </div>

        {/* Donut Chart */}
        <div className={styles.chartRow}>
          <div className={styles.donut}>
            <svg viewBox="0 0 36 36" className={styles.donutSvg}>
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9155" fill="none"
                stroke="var(--gold)"
                strokeWidth="3"
                strokeDasharray={`${capitalPct} ${interestPct}`}
                strokeDashoffset="25"
                strokeLinecap="round"
              />
              <circle
                cx="18" cy="18" r="15.9155" fill="none"
                stroke="var(--navy-500)"
                strokeWidth="3"
                strokeDasharray={`${interestPct} ${capitalPct}`}
                strokeDashoffset={`${25 - capitalPct}`}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: 'var(--gold)' }} />
              <span className={styles.legendText}>Capital: USD {formatUSD(calc.loanAmount)}</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: 'var(--navy-500)' }} />
              <span className={styles.legendText}>Intereses: USD {formatUSD(calc.totalInterest)}</span>
            </div>
            <div className={`${styles.legendItem} ${styles.legendTotal}`}>
              <span className={styles.legendText}>Total: USD {formatUSD(calc.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
