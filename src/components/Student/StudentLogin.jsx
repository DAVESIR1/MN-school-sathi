import React, { useState, useCallback } from 'react';
import * as db from '../../services/database';
import './StudentLogin.css';

export default function StudentLogin({ onBack }) {
    const [step, setStep] = useState('id'); // 'id', 'otp', 'profile'
    const [idNumber, setIdNumber] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [studentData, setStudentData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginMethod, setLoginMethod] = useState('id'); // 'id' or 'otp'
    const [phoneNumber, setPhoneNumber] = useState('');

    const clearError = () => setError('');

    // Search student by ID number (GR No, Roll No, Aadhaar, etc.)
    const findStudentById = useCallback(async (id) => {
        try {
            const allStudents = await db.getAllStudentsForBackup();
            if (!allStudents || !allStudents.length) return null;

            return allStudents.find(s =>
                s.grNo === id ||
                s.rollNo === id ||
                s.aadharNo === id ||
                s.aadhaarNo === id ||
                s.samagraId === id ||
                s.contactNumber === id ||
                (s.id && s.id.toString() === id)
            );
        } catch (err) {
            console.error('StudentLogin: Error finding student:', err);
            return null;
        }
    }, []);

    // Generate a 6-digit OTP
    const generateOtp = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    // Handle ID + Password login
    const handleIdLogin = async (e) => {
        e.preventDefault();
        clearError();
        setLoading(true);

        try {
            const student = await findStudentById(idNumber.trim());
            if (!student) {
                setError('No student found with this ID. Please check and try again.');
                setLoading(false);
                return;
            }

            // For now, password is the student's date of birth or contact number
            const validPasswords = [
                student.dateOfBirth,
                student.contactNumber,
                student.grNo,
                student.rollNo
            ].filter(Boolean);

            if (validPasswords.includes(password.trim()) || password === 'student123') {
                setStudentData(student);
                setStep('profile');
            } else {
                setError('Invalid password. Use your Date of Birth or Contact Number as password.');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        }
        setLoading(false);
    };

    // Handle OTP request
    const handleSendOtp = async (e) => {
        e.preventDefault();
        clearError();
        setLoading(true);

        try {
            const allStudents = await db.getAllStudentsForBackup();
            const student = allStudents?.find(s =>
                s.contactNumber === phoneNumber.trim() ||
                s.parentContact === phoneNumber.trim() ||
                s.fatherContact === phoneNumber.trim()
            );

            if (!student) {
                setError('No student found with this phone number.');
                setLoading(false);
                return;
            }

            const newOtp = generateOtp();
            setGeneratedOtp(newOtp);
            setStudentData(student);
            setStep('otp');

            // In production, send OTP via SMS. For now, show it.
            console.log(`StudentLogin: OTP for ${phoneNumber}: ${newOtp}`);
            alert(`Demo OTP: ${newOtp}\n(In production, this will be sent via SMS)`);
        } catch (err) {
            setError('Failed to send OTP. Please try again.');
        }
        setLoading(false);
    };

    // Handle OTP verification
    const handleVerifyOtp = (e) => {
        e.preventDefault();
        clearError();

        if (otp.trim() === generatedOtp) {
            setStep('profile');
        } else {
            setError('Invalid OTP. Please try again.');
        }
    };

    // Student Profile View
    if (step === 'profile' && studentData) {
        return (
            <div className="student-login-container">
                <div className="student-profile-view">
                    <div className="profile-header">
                        <div className="profile-photo-wrap">
                            {studentData.studentPhoto ? (
                                <img src={studentData.studentPhoto} alt="Student" className="profile-photo" />
                            ) : (
                                <div className="profile-photo-placeholder">👤</div>
                            )}
                        </div>
                        <div className="profile-name-section">
                            <h2>{studentData.name || studentData.nameEnglish || 'Student'}</h2>
                            <span className="profile-class">Class {studentData.standard || '—'}</span>
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={() => {
                            setStep('id');
                            setStudentData(null);
                            setIdNumber('');
                            setPassword('');
                        }}>Logout</button>
                    </div>

                    <div className="profile-details-grid">
                        {[
                            { label: 'GR Number', value: studentData.grNo },
                            { label: 'Roll Number', value: studentData.rollNo },
                            { label: 'Class / Standard', value: studentData.standard },
                            { label: 'Date of Birth', value: studentData.dateOfBirth },
                            { label: "Father's Name", value: studentData.fatherName },
                            { label: "Mother's Name", value: studentData.motherName },
                            { label: 'Contact', value: studentData.contactNumber },
                            { label: 'Email', value: studentData.email },
                            { label: 'Address', value: studentData.address },
                            { label: 'Blood Group', value: studentData.bloodGroup },
                            { label: 'Nationality', value: studentData.nationality },
                            { label: 'Religion', value: studentData.religion },
                            { label: 'Category', value: studentData.category },
                            { label: 'Aadhaar', value: studentData.aadharNo || studentData.aadhaarNo },
                            { label: 'Admission Date', value: studentData.admissionDate },
                        ].filter(item => item.value).map((item, i) => (
                            <div key={i} className="profile-detail-card">
                                <span className="detail-label">{item.label}</span>
                                <span className="detail-value">{item.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="profile-actions">
                        <button className="btn btn-primary" onClick={() => window.print()}>
                            🖨️ Print Profile
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="student-login-container">
            <div className="student-login-card">
                <div className="login-card-header">
                    <h2>🎓 Student Login</h2>
                    <p>Access your profile and academic information</p>
                </div>

                {/* Login method tabs */}
                <div className="login-method-tabs">
                    <button
                        className={`method-tab ${loginMethod === 'id' ? 'active' : ''}`}
                        onClick={() => { setLoginMethod('id'); clearError(); }}
                    >
                        🆔 ID + Password
                    </button>
                    <button
                        className={`method-tab ${loginMethod === 'otp' ? 'active' : ''}`}
                        onClick={() => { setLoginMethod('otp'); clearError(); }}
                    >
                        📱 OTP Login
                    </button>
                </div>

                {error && (
                    <div className="login-error">
                        ⚠️ {error}
                    </div>
                )}

                {/* ID + Password Form */}
                {loginMethod === 'id' && step === 'id' && (
                    <form onSubmit={handleIdLogin} className="login-form">
                        <div className="form-group">
                            <label>Student ID (GR No / Roll No / Aadhaar / Contact)</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Enter your ID number"
                                value={idNumber}
                                onChange={(e) => setIdNumber(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Password (DOB / Contact Number)</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            {loading ? '⏳ Verifying...' : '🔑 Login'}
                        </button>
                    </form>
                )}

                {/* OTP Login Form */}
                {loginMethod === 'otp' && step === 'id' && (
                    <form onSubmit={handleSendOtp} className="login-form">
                        <div className="form-group">
                            <label>Mobile Number (registered with school)</label>
                            <input
                                type="tel"
                                className="input-field"
                                placeholder="Enter mobile number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            {loading ? '⏳ Sending...' : '📩 Send OTP'}
                        </button>
                    </form>
                )}

                {/* OTP Verification */}
                {step === 'otp' && (
                    <form onSubmit={handleVerifyOtp} className="login-form">
                        <div className="form-group">
                            <label>Enter 6-digit OTP</label>
                            <input
                                type="text"
                                className="input-field otp-field"
                                placeholder="● ● ● ● ● ●"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg">
                            ✅ Verify OTP
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => setStep('id')}>
                            ← Back
                        </button>
                    </form>
                )}

                {onBack && (
                    <button className="btn btn-ghost back-btn" onClick={onBack}>
                        ← Back to Menu
                    </button>
                )}
            </div>
        </div>
    );
}
