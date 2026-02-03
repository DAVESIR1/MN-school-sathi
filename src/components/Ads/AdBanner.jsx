import React from 'react';
import { useUserTier } from '../../contexts/UserTierContext';
import { X, Sparkles } from 'lucide-react';
import './AdBanner.css';

export default function AdBanner({
    type = 'banner', // banner, sidebar, interstitial
    position = 'bottom', // top, bottom, sidebar
    showClose = false,
    onClose
}) {
    const { isFree, setShowUpgradeModal } = useUserTier();

    // Don't show ads to premium/admin users
    if (!isFree) return null;

    const handleUpgrade = () => {
        setShowUpgradeModal(true);
    };

    // Different ad sizes
    const adContent = {
        banner: {
            width: '100%',
            height: '90px',
            text: '📢 Advertisement Space',
            subtext: 'Upgrade to Premium to remove ads'
        },
        sidebar: {
            width: '160px',
            height: '600px',
            text: '📢 Ad',
            subtext: 'Go Premium'
        },
        leaderboard: {
            width: '100%',
            height: '90px',
            text: '📢 Your Ad Here - Contact for Advertising',
            subtext: 'Remove ads with Premium'
        },
        interstitial: {
            width: '100%',
            height: '250px',
            text: '📢 Support Our App',
            subtext: 'Upgrade to Premium for an ad-free experience!'
        }
    };

    const ad = adContent[type] || adContent.banner;

    return (
        <div className={`ad-banner ad-${type} ad-position-${position}`} style={{ minHeight: ad.height }}>
            <div className="ad-content">
                <div className="ad-label">AD</div>

                <div className="ad-placeholder">
                    {/* Placeholder content - replace with actual ad code */}
                    <div className="ad-placeholder-inner">
                        <span className="ad-text">{ad.text}</span>
                        <span className="ad-subtext">{ad.subtext}</span>
                    </div>
                </div>

                <button className="ad-upgrade-btn" onClick={handleUpgrade}>
                    <Sparkles size={14} />
                    Remove Ads
                </button>

                {showClose && onClose && (
                    <button className="ad-close-btn" onClick={onClose}>
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Google AdSense placeholder - uncomment and add your ad unit ID */}
            {/* 
            <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                data-ad-slot="XXXXXXXXXX"
                data-ad-format="auto"
                data-full-width-responsive="true">
            </ins>
            <script>
                (adsbygoogle = window.adsbygoogle || []).push({});
            </script>
            */}
        </div>
    );
}

// Ad placement component for between content
export function AdPlacement({ type = 'banner' }) {
    const { isFree } = useUserTier();

    if (!isFree) return null;

    return (
        <div className="ad-placement">
            <AdBanner type={type} />
        </div>
    );
}
