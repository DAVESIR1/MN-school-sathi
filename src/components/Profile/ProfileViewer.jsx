import React, { useState, useRef, useMemo } from 'react';
import { X, Download, Printer, Image, Search, Plus, Minus } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ProfileCard from './ProfileCard';
import IdCard, { TEMPLATES } from './IdCard';
import TemplateSelector from './TemplateSelector';
import './ProfileViewer.css';

// Paper size configurations with cards per page
const PAPER_SIZES = {
    a4: { name: 'A4', width: 210, height: 297, cols: 2, rows: 5, cards: 10 },
    letter: { name: 'Letter', width: 216, height: 279, cols: 2, rows: 5, cards: 10 },
    legal: { name: 'Legal', width: 216, height: 356, cols: 2, rows: 6, cards: 12 },
    a5: { name: 'A5', width: 148, height: 210, cols: 1, rows: 3, cards: 3 }
};

export default function ProfileViewer({
    isOpen,
    onClose,
    students,
    standards,
    schoolName,
    settings,
    schoolLogo,
    schoolContact
}) {
    const [selectedStandard, setSelectedStandard] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [template, setTemplate] = useState('classic');
    const [idCardTemplate, setIdCardTemplate] = useState('classic-elegant');
    const [viewMode, setViewMode] = useState('profile'); // 'profile' or 'idcard'
    const [paperSize, setPaperSize] = useState('a4');
    const [batchMode, setBatchMode] = useState(false);
    const [selectedGrNumbers, setSelectedGrNumbers] = useState([]);
    const [grSearchQuery, setGrSearchQuery] = useState('');
    const profileRef = useRef(null);
    const idCardRef = useRef(null);
    const batchPrintRef = useRef(null);

    // Calculate filtered students (needs to be before useMemo that depends on it)
    const filteredStudents = useMemo(() => {
        return selectedStandard
            ? students.filter(s => s.standard === selectedStandard)
            : students;
    }, [selectedStandard, students]);

    // Get students by GR numbers for batch printing
    const batchStudents = useMemo(() => {
        return selectedGrNumbers
            .map(gr => students.find(s => s.grNo === gr))
            .filter(Boolean);
    }, [selectedGrNumbers, students]);

    // Filter students for GR search
    const grSearchResults = useMemo(() => {
        if (!grSearchQuery.trim()) return [];
        const query = grSearchQuery.toLowerCase();
        return filteredStudents
            .filter(s =>
                s.grNo?.toLowerCase().includes(query) ||
                (s.name || s.nameEnglish || '').toLowerCase().includes(query)
            )
            .slice(0, 10);
    }, [grSearchQuery, filteredStudents]);

    if (!isOpen) return null;

    const addToGrSelection = (grNo) => {
        if (!selectedGrNumbers.includes(grNo)) {
            setSelectedGrNumbers([...selectedGrNumbers, grNo]);
        }
        setGrSearchQuery('');
    };

    const removeFromGrSelection = (grNo) => {
        setSelectedGrNumbers(selectedGrNumbers.filter(g => g !== grNo));
    };

    const handlePrint = () => {
        // Add print class to body for print-specific styles
        document.body.classList.add('printing-profile');
        window.print();
        // Remove class after print dialog closes
        setTimeout(() => {
            document.body.classList.remove('printing-profile');
        }, 1000);
    };

    const handleDownloadPDF = async () => {
        const element = batchMode && batchStudents.length > 0
            ? batchPrintRef.current
            : (viewMode === 'idcard' ? idCardRef.current : profileRef.current);
        if (!element) return;

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true
        });
        const imgData = canvas.toDataURL('image/png');

        const paper = PAPER_SIZES[paperSize];
        const pdf = new jsPDF({
            orientation: paper.width > paper.height ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [paper.width, paper.height]
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`${batchMode ? 'ID_Cards_Batch' : (viewMode === 'idcard' ? 'ID_Card' : 'Profile')}_${selectedStudent?.name || 'Student'}.pdf`);
    };

    const handleDownloadImage = async () => {
        const element = batchMode && batchStudents.length > 0
            ? batchPrintRef.current
            : (viewMode === 'idcard' ? idCardRef.current : profileRef.current);
        if (!element) return;

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true
        });
        const link = document.createElement('a');
        link.download = `${batchMode ? 'ID_Cards_Batch' : (viewMode === 'idcard' ? 'ID_Card' : 'Profile')}_${selectedStudent?.name || 'Student'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const paper = PAPER_SIZES[paperSize];
    const maxCardsPerPage = paper.cards;

    return (
        <div className="profile-viewer-overlay animate-fade-in" onClick={onClose}>
            <div className="profile-viewer-container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="profile-viewer-header no-print">
                    <h2 className="display-font gradient-text">
                        {viewMode === 'idcard' ? '🪪 Student ID Card' : '👤 Student Profile'}
                    </h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Controls */}
                <div className="profile-controls no-print">
                    <div className="control-group">
                        <label>Standard:</label>
                        <select
                            className="input-field"
                            value={selectedStandard}
                            onChange={(e) => {
                                setSelectedStandard(e.target.value);
                                setSelectedStudent(null);
                                setSelectedGrNumbers([]);
                            }}
                        >
                            <option value="">All Standards</option>
                            {standards.map(std => (
                                <option key={std.id} value={std.id}>{std.name}</option>
                            ))}
                        </select>
                    </div>

                    {!batchMode && (
                        <div className="control-group">
                            <label>Student:</label>
                            <select
                                className="input-field"
                                value={selectedStudent?.id || ''}
                                onChange={(e) => {
                                    const student = filteredStudents.find(s => s.id == e.target.value);
                                    setSelectedStudent(student);
                                }}
                            >
                                <option value="">Select Student</option>
                                {filteredStudents.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name || s.nameEnglish} - GR: {s.grNo}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="control-group view-toggle">
                        <button
                            className={`toggle-btn ${viewMode === 'profile' ? 'active' : ''}`}
                            onClick={() => { setViewMode('profile'); setBatchMode(false); }}
                        >
                            📋 Full Profile
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'idcard' ? 'active' : ''}`}
                            onClick={() => setViewMode('idcard')}
                        >
                            🪪 ID Card
                        </button>
                    </div>
                </div>

                {/* ID Card Mode Controls */}
                {viewMode === 'idcard' && (
                    <div className="idcard-controls no-print">
                        {/* Paper Size Selector */}
                        <div className="paper-size-selector">
                            <label>📄 Paper Size:</label>
                            <div className="paper-options">
                                {Object.entries(PAPER_SIZES).map(([key, size]) => (
                                    <button
                                        key={key}
                                        className={`paper-btn ${paperSize === key ? 'active' : ''}`}
                                        onClick={() => setPaperSize(key)}
                                    >
                                        {size.name}
                                        <span className="paper-cards">{size.cards} cards</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Batch Mode Toggle */}
                        <div className="batch-toggle">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={batchMode}
                                    onChange={(e) => setBatchMode(e.target.checked)}
                                />
                                🔢 Batch Print Multiple Cards
                            </label>
                        </div>

                        {/* GR Number Selection (Batch Mode) */}
                        {batchMode && (
                            <div className="gr-selector">
                                <div className="gr-search-wrap">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Search by GR No. or Name..."
                                        value={grSearchQuery}
                                        onChange={(e) => setGrSearchQuery(e.target.value)}
                                    />
                                </div>

                                {grSearchResults.length > 0 && (
                                    <div className="gr-search-results">
                                        {grSearchResults.map(s => (
                                            <button
                                                key={s.grNo}
                                                className="gr-result-item"
                                                onClick={() => addToGrSelection(s.grNo)}
                                            >
                                                <Plus size={14} />
                                                <span className="gr-no">{s.grNo}</span>
                                                <span className="gr-name">{s.name || s.nameEnglish}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {selectedGrNumbers.length > 0 && (
                                    <div className="selected-gr-list">
                                        <span className="selected-count">
                                            Selected: {selectedGrNumbers.length} / {maxCardsPerPage} per page
                                        </span>
                                        <div className="gr-chips">
                                            {selectedGrNumbers.map(gr => (
                                                <span key={gr} className="gr-chip">
                                                    {gr}
                                                    <button onClick={() => removeFromGrSelection(gr)}>
                                                        <Minus size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Template Selector (only for full profile) */}
                {viewMode === 'profile' && (
                    <TemplateSelector
                        selected={template}
                        onSelect={setTemplate}
                    />
                )}

                {/* ID Card Template Selector (15 styles) */}
                {viewMode === 'idcard' && (
                    <div className="id-template-selector no-print">
                        <label className="template-label">Choose ID Card Style:</label>
                        <div className="id-template-grid">
                            {TEMPLATES.map(t => (
                                <button
                                    key={t.id}
                                    className={`id-template-btn ${idCardTemplate === t.id ? 'active' : ''}`}
                                    onClick={() => setIdCardTemplate(t.id)}
                                    title={t.name}
                                >
                                    <span className="template-icon">{t.icon}</span>
                                    <span className="template-name">{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Profile/ID Card Display */}
                <div className="profile-display">
                    {/* Batch ID Card Print View */}
                    {viewMode === 'idcard' && batchMode && batchStudents.length > 0 ? (
                        <div
                            ref={batchPrintRef}
                            className={`id-card-print-sheet paper-${paperSize}`}
                        >
                            {batchStudents.map((student, idx) => (
                                <IdCard
                                    key={student.grNo || idx}
                                    student={student}
                                    schoolName={schoolName}
                                    schoolLogo={schoolLogo}
                                    schoolContact={schoolContact}
                                    template={idCardTemplate}
                                />
                            ))}
                        </div>
                    ) : selectedStudent ? (
                        viewMode === 'idcard' ? (
                            <div className="id-card-preview-wrap">
                                <IdCard
                                    ref={idCardRef}
                                    student={selectedStudent}
                                    schoolName={schoolName}
                                    schoolLogo={schoolLogo}
                                    schoolContact={schoolContact}
                                    template={idCardTemplate}
                                />
                            </div>
                        ) : (
                            <ProfileCard
                                ref={profileRef}
                                student={selectedStudent}
                                template={template}
                                schoolName={schoolName}
                                schoolLogo={schoolLogo}
                                schoolContact={schoolContact}
                            />
                        )
                    ) : (
                        <div className="no-selection">
                            <span className="empty-icon">👆</span>
                            <p>
                                {batchMode
                                    ? 'Search and select students by GR number above'
                                    : `Select a student to view their ${viewMode === 'idcard' ? 'ID Card' : 'profile'}`
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Export Actions */}
                {(selectedStudent || (batchMode && batchStudents.length > 0)) && (
                    <div className="export-actions no-print">
                        <button className="btn btn-secondary" onClick={handlePrint}>
                            <Printer size={18} />
                            Print
                        </button>
                        <button className="btn btn-primary" onClick={handleDownloadPDF}>
                            <Download size={18} />
                            Download PDF
                        </button>
                        <button className="btn btn-accent" onClick={handleDownloadImage}>
                            <Image size={18} />
                            Save as Image
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
