import React, { useState } from 'react';
import { X, Crown, Check, Sparkles, Zap } from 'lucide-react';
import { useUserTier, PREMIUM_FEATURES, PREMIUM_PRICING } from '../../contexts/UserTierContext';
import './UpgradeModal.css';

export default function UpgradeModal() {
    const {
        showUpgradeModal,
        setShowUpgradeModal,
        upgradeToPremium,
        pricing,
        features
    } = useUserTier();

    const [selectedPlan, setSelectedPlan] = useState('yearly');
    const [processing, setProcessing] = useState(false);

    if (!showUpgradeModal) return null;

    const handleUpgrade = async () => {
        setProcessing(true);
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        upgradeToPremium(selectedPlan);
        setProcessing(false);
    };

    const handleClose = () => {
        setShowUpgradeModal(false);
    };

    return (
        <div className="upgrade-overlay" onClick={handleClose}>
            <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
                {/* Close Button */}
                <button className="upgrade-close" onClick={handleClose}>
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="upgrade-header">
                    <div className="crown-icon">
                        <Crown size={40} />
                    </div>
                    <h2>Upgrade to Premium</h2>
                    <p>Unlock all features and remove ads</p>
                </div>

                {/* Pricing Plans */}
                <div className="pricing-plans">
                    <div
                        className={`plan-card ${selectedPlan === 'monthly' ? 'selected' : ''}`}
                        onClick={() => setSelectedPlan('monthly')}
                    >
                        <div className="plan-name">Monthly</div>
                        <div className="plan-price">
                            <span className="currency">{pricing.monthly.currency}</span>
                            <span className="amount">{pricing.monthly.amount}</span>
                            <span className="period">/{pricing.monthly.period}</span>
                        </div>
                    </div>

                    <div
                        className={`plan-card ${selectedPlan === 'yearly' ? 'selected' : ''}`}
                        onClick={() => setSelectedPlan('yearly')}
                    >
                        {pricing.yearly.savings && (
                            <div className="plan-badge">Save {pricing.yearly.savings}</div>
                        )}
                        <div className="plan-name">Yearly</div>
                        <div className="plan-price">
                            <span className="currency">{pricing.yearly.currency}</span>
                            <span className="amount">{pricing.yearly.amount}</span>
                            <span className="period">/{pricing.yearly.period}</span>
                        </div>
                    </div>
                </div>

                {/* Features List */}
                <div className="premium-features">
                    <h3>Premium Features</h3>
                    <ul className="features-list">
                        {features.map((feature, index) => (
                            <li key={index} className="feature-item">
                                <span className="feature-icon">{feature.icon}</span>
                                <div className="feature-info">
                                    <span className="feature-title">{feature.title}</span>
                                    <span className="feature-desc">{feature.description}</span>
                                </div>
                                <Check size={18} className="feature-check" />
                            </li>
                        ))}
                    </ul>
                </div>

                {/* CTA Button */}
                <button
                    className="upgrade-btn"
                    onClick={handleUpgrade}
                    disabled={processing}
                >
                    {processing ? (
                        <>
                            <Zap className="spin" size={20} />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            Upgrade Now - {pricing[selectedPlan].currency}{pricing[selectedPlan].amount}
                        </>
                    )}
                </button>

                {/* Terms */}
                <p className="upgrade-terms">
                    Cancel anytime • Secure payment • Instant activation
                </p>
            </div>
        </div>
    );
}
