/**
 * Citation Renderer Demo
 * Standalone component to preview citation rendering options
 * 
 * This demo shows different approaches for displaying citations:
 * 1. Inline Chips (numbered badges)
 * 2. Hover Popups (preview on hover)
 * 3. Side Panel (full document view)
 * 4. Highlighting (text highlighting)
 */

import React, { useState } from 'react';

// Sample data
const SAMPLE_TEXT = `The supplier of the Roof Tiles (Terrazzo or Similar) is {{citation:Market Pricing Survey – Saudi Arabia (Riyadh_Al Qassim_Hail).pdf|Page 5|AlSarif Group (Riyadh)}} and the product unit is {{citation:Market Pricing Survey – Saudi Arabia (Riyadh_Al Qassim_Hail).pdf|Page 5|Terrazzo Tile, 30×30×3 cm}}.`;

const SAMPLE_FILES = [
  {
    id: '1',
    name: 'Market Pricing Survey – Saudi Arabia (Riyadh_Al Qassim_Hail).pdf',
    type: 'pdf',
    content: 'Sample PDF content...'
  }
];

// ============================================================================
// OPTION 1: INLINE CHIPS WITH HOVER POPUP
// ============================================================================

interface CitationChipProps {
  index: number;
  filename: string;
  location: string;
  quote: string;
  onViewDocument: (filename: string, location: string, quote: string) => void;
}

const CitationChip: React.FC<CitationChipProps> = ({ index, filename, location, quote, onViewDocument }) => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div className="relative inline-block">
      {/* Chip Badge */}
      <button
        onMouseEnter={() => setShowPopup(true)}
        onMouseLeave={() => setShowPopup(false)}
        onClick={() => onViewDocument(filename, location, quote)}
        className="inline-flex items-center justify-center w-6 h-6 mx-0.5 text-xs font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 cursor-pointer transition-colors"
        title={`Citation ${index + 1}: ${filename}`}
      >
        {index + 1}
      </button>

      {/* Hover Popup */}
      {showPopup && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 w-64">
          <div className="text-xs">
            <div className="font-bold text-gray-900 mb-1 truncate">{filename}</div>
            <div className="text-gray-600 mb-2">{location}</div>
            <div className="text-gray-700 italic border-l-2 border-blue-400 pl-2 py-1">
              "{quote}"
            </div>
            <button
              onClick={() => onViewDocument(filename, location, quote)}
              className="mt-2 w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Document
            </button>
          </div>
          {/* Popup Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-gray-300"></div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// OPTION 2: INLINE CHIPS WITH CLICK POPUP (MODAL)
// ============================================================================

interface CitationModalProps {
  citation: { index: number; filename: string; location: string; quote: string } | null;
  onClose: () => void;
}

const CitationModal: React.FC<CitationModalProps> = ({ citation, onClose }) => {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-gray-900">Citation {citation.index + 1}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-600">Source</label>
            <p className="text-sm text-gray-900 font-mono">{citation.filename}</p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600">Location</label>
            <p className="text-sm text-gray-900">{citation.location}</p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600">Quote</label>
            <p className="text-sm text-gray-900 italic border-l-4 border-blue-400 pl-3 py-2 bg-gray-50">
              "{citation.quote}"
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// OPTION 3: SUPERSCRIPT NUMBERS (ACADEMIC STYLE)
// ============================================================================

const CitationSuperscript: React.FC<CitationChipProps> = ({ index, filename, location, quote, onViewDocument }) => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div className="relative inline">
      <sup
        onMouseEnter={() => setShowPopup(true)}
        onMouseLeave={() => setShowPopup(false)}
        onClick={() => onViewDocument(filename, location, quote)}
        className="text-blue-600 font-bold cursor-pointer hover:text-blue-800 transition-colors"
        title={`Citation ${index + 1}`}
      >
        [{index + 1}]
      </sup>

      {showPopup && (
        <div className="absolute bottom-full left-0 mb-2 z-50 bg-white border border-gray-300 rounded shadow-lg p-2 w-56 text-xs">
          <div className="font-bold text-gray-900 truncate mb-1">{filename}</div>
          <div className="text-gray-600 mb-1">{location}</div>
          <div className="text-gray-700 italic border-l-2 border-blue-400 pl-2">"{quote}"</div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// OPTION 4: INLINE HIGHLIGHT WITH TOOLTIP
// ============================================================================

const CitationHighlight: React.FC<CitationChipProps> = ({ index, filename, location, quote, onViewDocument }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline">
      <span
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => onViewDocument(filename, location, quote)}
        className="bg-yellow-200 px-1 rounded cursor-pointer hover:bg-yellow-300 transition-colors border-b-2 border-yellow-400"
        title={`Citation ${index + 1}: ${filename}`}
      >
        [Citation {index + 1}]
      </span>

      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 z-50 bg-gray-900 text-white rounded shadow-lg p-2 w-56 text-xs">
          <div className="font-bold mb-1">{filename}</div>
          <div className="text-gray-300 mb-1">{location}</div>
          <div className="italic">"{quote}"</div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN DEMO COMPONENT
// ============================================================================

type RenderMode = 'chips' | 'superscript' | 'highlight' | 'none';

const CitationRendererDemo: React.FC = () => {
  const [renderMode, setRenderMode] = useState<RenderMode>('chips');
  const [selectedCitation, setSelectedCitation] = useState<{ index: number; filename: string; location: string; quote: string } | null>(null);
  const [viewedDocument, setViewedDocument] = useState<string | null>(null);

  // Parse citations from text
  const citations = [
    {
      index: 0,
      filename: 'Market Pricing Survey – Saudi Arabia (Riyadh_Al Qassim_Hail).pdf',
      location: 'Page 5',
      quote: 'AlSarif Group (Riyadh)'
    },
    {
      index: 1,
      filename: 'Market Pricing Survey – Saudi Arabia (Riyadh_Al Qassim_Hail).pdf',
      location: 'Page 5',
      quote: 'Terrazzo Tile, 30×30×3 cm'
    }
  ];

  const handleViewDocument = (filename: string, location: string, quote: string) => {
    setViewedDocument(`${filename} - ${location}`);
    console.log('View document:', { filename, location, quote });
  };

  // Render text with citations based on mode
  const renderText = () => {
    if (renderMode === 'none') {
      return <p className="text-gray-900">{SAMPLE_TEXT.replace(/\{\{citation:[^}]+\}\}/g, '[citation]')}</p>;
    }

    return (
      <p className="text-gray-900 leading-relaxed">
        The supplier of the Roof Tiles (Terrazzo or Similar) is{' '}
        {renderMode === 'chips' && (
          <CitationChip
            index={0}
            filename={citations[0].filename}
            location={citations[0].location}
            quote={citations[0].quote}
            onViewDocument={handleViewDocument}
          />
        )}
        {renderMode === 'superscript' && (
          <CitationSuperscript
            index={0}
            filename={citations[0].filename}
            location={citations[0].location}
            quote={citations[0].quote}
            onViewDocument={handleViewDocument}
          />
        )}
        {renderMode === 'highlight' && (
          <CitationHighlight
            index={0}
            filename={citations[0].filename}
            location={citations[0].location}
            quote={citations[0].quote}
            onViewDocument={handleViewDocument}
          />
        )}
        {' '}AlSarif Group (Riyadh) and the product unit is{' '}
        {renderMode === 'chips' && (
          <CitationChip
            index={1}
            filename={citations[1].filename}
            location={citations[1].location}
            quote={citations[1].quote}
            onViewDocument={handleViewDocument}
          />
        )}
        {renderMode === 'superscript' && (
          <CitationSuperscript
            index={1}
            filename={citations[1].filename}
            location={citations[1].location}
            quote={citations[1].quote}
            onViewDocument={handleViewDocument}
          />
        )}
        {renderMode === 'highlight' && (
          <CitationHighlight
            index={1}
            filename={citations[1].filename}
            location={citations[1].location}
            quote={citations[1].quote}
            onViewDocument={handleViewDocument}
          />
        )}
        {' '}Terrazzo Tile, 30×30×3 cm.
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Citation Renderer Demo</h1>
          <p className="text-gray-600">Compare different citation display options</p>
        </div>

        {/* Mode Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Display Mode</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'chips', label: 'Inline Chips', desc: 'Numbered badges' },
              { value: 'superscript', label: 'Superscript', desc: 'Academic style' },
              { value: 'highlight', label: 'Highlight', desc: 'Yellow background' },
              { value: 'none', label: 'No Citations', desc: 'Plain text' }
            ].map(mode => (
              <button
                key={mode.value}
                onClick={() => setRenderMode(mode.value as RenderMode)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  renderMode === mode.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-bold text-sm text-gray-900">{mode.label}</div>
                <div className="text-xs text-gray-600">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Preview</h2>
          <div className="bg-gray-50 p-6 rounded border border-gray-200">
            {renderText()}
          </div>
          {viewedDocument && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
              Last viewed: {viewedDocument}
            </div>
          )}
        </div>

        {/* Citation List */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Citations Used</h2>
          <div className="space-y-3">
            {citations.map(citation => (
              <div key={citation.index} className="border border-gray-200 rounded p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {citation.index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-gray-900 truncate">{citation.filename}</div>
                    <div className="text-xs text-gray-600 mt-1">{citation.location}</div>
                    <div className="text-sm text-gray-700 italic mt-2">"{citation.quote}"</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Features Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-bold text-gray-900">Feature</th>
                  <th className="text-center py-2 px-3 font-bold text-gray-900">Chips</th>
                  <th className="text-center py-2 px-3 font-bold text-gray-900">Superscript</th>
                  <th className="text-center py-2 px-3 font-bold text-gray-900">Highlight</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Visually Prominent', chips: '✅', super: '⚠️', highlight: '✅' },
                  { feature: 'Academic Style', chips: '❌', super: '✅', highlight: '❌' },
                  { feature: 'Easy to Click', chips: '✅', super: '⚠️', highlight: '✅' },
                  { feature: 'Hover Preview', chips: '✅', super: '✅', highlight: '✅' },
                  { feature: 'Mobile Friendly', chips: '✅', super: '⚠️', highlight: '✅' },
                  { feature: 'Text Flow', chips: '⚠️', super: '✅', highlight: '⚠️' }
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-900">{row.feature}</td>
                    <td className="py-2 px-3 text-center">{row.chips}</td>
                    <td className="py-2 px-3 text-center">{row.super}</td>
                    <td className="py-2 px-3 text-center">{row.highlight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Citation Modal */}
      <CitationModal citation={selectedCitation} onClose={() => setSelectedCitation(null)} />
    </div>
  );
};

export default CitationRendererDemo;
