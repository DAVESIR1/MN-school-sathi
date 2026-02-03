import React, { forwardRef } from 'react';
import './IdCard.css';

// 15 Premium Templates inspired by best modern ID card designs
const TEMPLATES = [
    { id: 'classic-elegant', name: 'Classic Elegant', icon: '🎓' },
    { id: 'modern-minimal', name: 'Modern Minimal', icon: '✨' },
    { id: 'colorful-fun', name: 'Colorful Fun', icon: '🌈' },
    { id: 'professional', name: 'Professional', icon: '💼' },
    { id: 'vintage-certificate', name: 'Vintage Certificate', icon: '🏆' },
    { id: 'gradient-wave', name: 'Gradient Wave', icon: '🌊' },
    { id: 'dark-premium', name: 'Dark Premium', icon: '🌙' },
    { id: 'sky-fresh', name: 'Sky Fresh', icon: '☁️' },
    { id: 'royal-gold', name: 'Royal Gold', icon: '👑' },
    { id: 'ocean-breeze', name: 'Ocean Breeze', icon: '🐋' },
    { id: 'cherry-blossom', name: 'Cherry Blossom', icon: '🌸' },
    { id: 'tech-future', name: 'Tech Future', icon: '💻' },
    { id: 'sports-dynamic', name: 'Sports Dynamic', icon: '⚽' },
    { id: 'creative-art', name: 'Creative Art', icon: '🎨' },
    { id: 'eco-nature', name: 'Eco Nature', icon: '🌿' }
];

const IdCard = forwardRef(({
    student,
    schoolName,
    schoolLogo,
    schoolContact,
    schoolEmail,
    template = 'classic-elegant'
}, ref) => {
    if (!student) return null;

    // Required fields - always displayed
    const studentName = student.name || student.nameEnglish || 'Student Name';
    const grNo = student.grNo || '—';
    const standard = student.standard || '—';
    const rollNo = student.rollNo || '—';
    const contact = student.contactNumber || schoolContact || '—';
    const email = student.email || schoolEmail || '';
    const photo = student.studentPhoto;
    const logo = schoolLogo;
    const school = schoolName || 'School Name';

    return (
        <div ref={ref} className={`id-card template-${template}`}>
            {/* Background Decorations */}
            <div className="id-bg-layer">
                <div className="id-bg-gradient"></div>
                <div className="id-bg-pattern"></div>
                <div className="id-bg-shape shape-1"></div>
                <div className="id-bg-shape shape-2"></div>
                <div className="id-bg-shape shape-3"></div>
                <div className="id-accent-bar"></div>
            </div>

            {/* Main Content */}
            <div className="id-content">
                {/* Top Section: School Info */}
                <header className="id-header">
                    <div className="id-logo-wrap">
                        {logo ? (
                            <img src={logo} alt="Logo" className="id-logo-img" />
                        ) : (
                            <div className="id-logo-default">🏫</div>
                        )}
                    </div>
                    <div className="id-school-text">
                        <h1 className="id-school-name">{school}</h1>
                        <div className="id-card-type">STUDENT IDENTITY CARD</div>
                    </div>
                </header>

                {/* Middle Section: Photo + Info */}
                <main className="id-main">
                    <div className="id-photo-section">
                        <div className="id-photo-container">
                            {photo ? (
                                <img src={photo} alt="Student" className="id-photo-img" />
                            ) : (
                                <div className="id-photo-empty">
                                    <span className="photo-icon">👤</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="id-info-section">
                        <div className="id-student-name">{studentName}</div>

                        <div className="id-fields">
                            <div className="id-field">
                                <span className="field-label">GR No.</span>
                                <span className="field-value">{grNo}</span>
                            </div>
                            <div className="id-field">
                                <span className="field-label">Class</span>
                                <span className="field-value">{standard}</span>
                            </div>
                            <div className="id-field">
                                <span className="field-label">Roll No.</span>
                                <span className="field-value">{rollNo}</span>
                            </div>
                        </div>

                        <div className="id-contact-info">
                            <div className="contact-row">
                                <span className="contact-icon">📞</span>
                                <span className="contact-text">{contact}</span>
                            </div>
                            {email && (
                                <div className="contact-row">
                                    <span className="contact-icon">✉️</span>
                                    <span className="contact-text">{email}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Bottom Section: Footer */}
                <footer className="id-footer">
                    <div className="id-validity">
                        <span className="validity-label">Valid:</span>
                        <span className="validity-year">{new Date().getFullYear()}-{new Date().getFullYear() + 1}</span>
                    </div>
                    <div className="id-auth">
                        <div className="auth-line"></div>
                        <span className="auth-text">Authorized Signature</span>
                    </div>
                </footer>
            </div>
        </div>
    );
});

IdCard.displayName = 'IdCard';
export { TEMPLATES };
export default IdCard;
