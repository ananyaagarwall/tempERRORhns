import React, { useState } from 'react';
import './MortgageCalculator.css';

const MortgageCalculator = () => {
  const [propertyPrice, setPropertyPrice] = useState(10000000); // 1 Cr
  const [downPayment, setDownPayment] = useState(20); // Percentage
  const [loanAmount, setLoanAmount] = useState(8000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20); // Years

  const handlePropertyPriceChange = (e) => {
    const price = parseFloat(e.target.value) || 0;
    setPropertyPrice(price);
    const newLoanAmount = price * (1 - downPayment / 100);
    setLoanAmount(newLoanAmount);
  };

  const handleDownPaymentChange = (e) => {
    const dp = parseFloat(e.target.value) || 0;
    setDownPayment(dp);
    const newLoanAmount = propertyPrice * (1 - dp / 100);
    setLoanAmount(newLoanAmount);
  };

  const handleLoanAmountChange = (e) => {
    const amount = parseFloat(e.target.value) || 0;
    setLoanAmount(amount);
    const newDownPayment = ((propertyPrice - amount) / propertyPrice) * 100;
    setDownPayment(newDownPayment >= 0 ? newDownPayment : 0);
  };

  // Calculate EMI
  const calculateEMI = () => {
    if (!loanAmount || !interestRate || !loanTenure) return 0;

    const monthlyRate = interestRate / 12 / 100;
    const numberOfMonths = loanTenure * 12;
    
    if (monthlyRate === 0) {
      return loanAmount / numberOfMonths;
    }

    const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths)) /
                (Math.pow(1 + monthlyRate, numberOfMonths) - 1);
    
    return emi;
  };

  const emi = calculateEMI();
  const totalAmount = emi * loanTenure * 12;
  const totalInterest = totalAmount - loanAmount;

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹ ${(amount / 100000).toFixed(2)} L`;
    } else {
      return `₹ ${amount.toLocaleString('en-IN')}`;
    }
  };

  return (
    <div className="mortgage-calculator">
      <h3 className="calculator-title">Mortgage Calculator</h3>
      
      <div className="calculator-form">
        <div className="form-group">
          <label htmlFor="property-price">
            Property Price
            <span className="input-value">{formatCurrency(propertyPrice)}</span>
          </label>
          <input
            type="range"
            id="property-price"
            min="1000000"
            max="100000000"
            step="100000"
            value={propertyPrice}
            onChange={handlePropertyPriceChange}
          />
          <div className="range-labels">
            <span>₹ 10 L</span>
            <span>₹ 10 Cr</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="down-payment">
            Down Payment
            <span className="input-value">{downPayment.toFixed(1)}% ({formatCurrency(propertyPrice * downPayment / 100)})</span>
          </label>
          <input
            type="range"
            id="down-payment"
            min="10"
            max="90"
            step="1"
            value={downPayment}
            onChange={handleDownPaymentChange}
          />
          <div className="range-labels">
            <span>10%</span>
            <span>90%</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="loan-amount">
            Loan Amount
            <span className="input-value">{formatCurrency(loanAmount)}</span>
          </label>
          <input
            type="range"
            id="loan-amount"
            min="100000"
            max={propertyPrice * 0.9}
            step="100000"
            value={loanAmount}
            onChange={handleLoanAmountChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="interest-rate">
            Interest Rate (per annum)
            <span className="input-value">{interestRate.toFixed(2)}%</span>
          </label>
          <input
            type="range"
            id="interest-rate"
            min="6"
            max="15"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(parseFloat(e.target.value))}
          />
          <div className="range-labels">
            <span>6%</span>
            <span>15%</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="loan-tenure">
            Loan Tenure
            <span className="input-value">{loanTenure} years</span>
          </label>
          <input
            type="range"
            id="loan-tenure"
            min="5"
            max="30"
            step="1"
            value={loanTenure}
            onChange={(e) => setLoanTenure(parseInt(e.target.value))}
          />
          <div className="range-labels">
            <span>5 years</span>
            <span>30 years</span>
          </div>
        </div>
      </div>

      <div className="calculator-results">
        <div className="result-item emi-result">
          <div className="result-label">Monthly EMI</div>
          <div className="result-value">{formatCurrency(emi)}</div>
        </div>
        <div className="result-item">
          <div className="result-label">Total Interest</div>
          <div className="result-value">{formatCurrency(totalInterest)}</div>
        </div>
        <div className="result-item">
          <div className="result-label">Total Amount</div>
          <div className="result-value">{formatCurrency(totalAmount)}</div>
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator;

