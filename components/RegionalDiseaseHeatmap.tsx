import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

export interface OutbreakDataPoint {
  region: string;
  distanceKm: number;
  disease: string;
  caseCount: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  week: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  advisory: string;
}

// Anonymized livestock outbreak data across surrounding dairy clusters
const REGIONAL_OUTBREAK_DATA: OutbreakDataPoint[] = [
  // Anand Rural (immediate vicinity)
  { region: 'Anand Central', distanceKm: 4, disease: 'FMD (Foot & Mouth)', caseCount: 14, riskLevel: 'High', week: 'W40', trend: 'increasing', advisory: 'Vaccinate unboostered cattle within 5 km radius' },
  { region: 'Anand Central', distanceKm: 4, disease: 'PPR (Goat Plague)', caseCount: 8, riskLevel: 'Moderate', week: 'W40', trend: 'stable', advisory: 'Inspect goats for mouth ulcerations and discharge' },
  { region: 'Anand Central', distanceKm: 4, disease: 'Lumpy Skin (LSD)', caseCount: 2, riskLevel: 'Low', week: 'W40', trend: 'decreasing', advisory: 'Vector control and mosquito nets recommended' },
  { region: 'Anand Central', distanceKm: 4, disease: 'Mastitis (Bovine)', caseCount: 19, riskLevel: 'High', week: 'W40', trend: 'increasing', advisory: 'Maintain post-milking teat dipping protocols' },
  { region: 'Anand Central', distanceKm: 4, disease: 'HS (Septicemia)', caseCount: 1, riskLevel: 'Low', week: 'W40', trend: 'stable', advisory: 'Pre-monsoon oil adjuvant booster status clear' },

  // Petlad (12 km)
  { region: 'Petlad Sub-cluster', distanceKm: 12, disease: 'FMD (Foot & Mouth)', caseCount: 21, riskLevel: 'Severe', week: 'W40', trend: 'increasing', advisory: 'Active quarantine in western wards; avoid animal movement' },
  { region: 'Petlad Sub-cluster', distanceKm: 12, disease: 'PPR (Goat Plague)', caseCount: 16, riskLevel: 'High', week: 'W40', trend: 'increasing', advisory: 'Ring deworming and PPR Sungri-96 drive ongoing' },
  { region: 'Petlad Sub-cluster', distanceKm: 12, disease: 'Lumpy Skin (LSD)', caseCount: 5, riskLevel: 'Moderate', week: 'W40', trend: 'stable', advisory: 'Isolate newly purchased bovines for 14 days' },
  { region: 'Petlad Sub-cluster', distanceKm: 12, disease: 'Mastitis (Bovine)', caseCount: 11, riskLevel: 'Moderate', week: 'W40', trend: 'stable', advisory: 'Regular somatic cell count strip tests' },
  { region: 'Petlad Sub-cluster', distanceKm: 12, disease: 'HS (Septicemia)', caseCount: 0, riskLevel: 'Low', week: 'W40', trend: 'decreasing', advisory: 'No reported cases this cycle' },

  // Borsad (18 km)
  { region: 'Borsad Taluka', distanceKm: 18, disease: 'FMD (Foot & Mouth)', caseCount: 6, riskLevel: 'Moderate', week: 'W40', trend: 'decreasing', advisory: 'Previous cluster subsiding after ring vaccination' },
  { region: 'Borsad Taluka', distanceKm: 18, disease: 'PPR (Goat Plague)', caseCount: 3, riskLevel: 'Low', week: 'W40', trend: 'decreasing', advisory: 'Stable status across cooperative societies' },
  { region: 'Borsad Taluka', distanceKm: 18, disease: 'Lumpy Skin (LSD)', caseCount: 12, riskLevel: 'High', week: 'W40', trend: 'increasing', advisory: 'Fly and tick sanitization across cattle sheds' },
  { region: 'Borsad Taluka', distanceKm: 18, disease: 'Mastitis (Bovine)', caseCount: 7, riskLevel: 'Low', week: 'W40', trend: 'stable', advisory: 'Clean bedding dry-powder dusting' },
  { region: 'Borsad Taluka', distanceKm: 18, disease: 'HS (Septicemia)', caseCount: 4, riskLevel: 'Moderate', week: 'W40', trend: 'stable', advisory: 'Check waterlogged grazing zones' },

  // Umreth (22 km)
  { region: 'Umreth North', distanceKm: 22, disease: 'FMD (Foot & Mouth)', caseCount: 3, riskLevel: 'Low', week: 'W40', trend: 'stable', advisory: 'Routine monitoring by local milk society' },
  { region: 'Umreth North', distanceKm: 22, disease: 'PPR (Goat Plague)', caseCount: 1, riskLevel: 'Low', week: 'W40', trend: 'decreasing', advisory: 'All herds reported healthy' },
  { region: 'Umreth North', distanceKm: 22, disease: 'Lumpy Skin (LSD)', caseCount: 4, riskLevel: 'Low', week: 'W40', trend: 'stable', advisory: 'Normal vigilance' },
  { region: 'Umreth North', distanceKm: 22, disease: 'Mastitis (Bovine)', caseCount: 14, riskLevel: 'Moderate', week: 'W40', trend: 'increasing', advisory: 'Disinfect milking machinery liners' },
  { region: 'Umreth North', distanceKm: 22, disease: 'HS (Septicemia)', caseCount: 0, riskLevel: 'Low', week: 'W40', trend: 'stable', advisory: 'No active clinical reports' },

  // Khambhat (28 km)
  { region: 'Khambhat Coast', distanceKm: 28, disease: 'FMD (Foot & Mouth)', caseCount: 9, riskLevel: 'Moderate', week: 'W40', trend: 'stable', advisory: 'Coastal humidity requires dry floor management' },
  { region: 'Khambhat Coast', distanceKm: 28, disease: 'PPR (Goat Plague)', caseCount: 5, riskLevel: 'Moderate', week: 'W40', trend: 'stable', advisory: 'Vaccination van scheduled this Friday' },
  { region: 'Khambhat Coast', distanceKm: 28, disease: 'Lumpy Skin (LSD)', caseCount: 8, riskLevel: 'Moderate', week: 'W40', trend: 'increasing', advisory: 'Coastal salinity spray not effective; use neem oil' },
  { region: 'Khambhat Coast', distanceKm: 28, disease: 'Mastitis (Bovine)', caseCount: 16, riskLevel: 'High', week: 'W40', trend: 'increasing', advisory: 'High humidity increases bacterial load in stalls' },
  { region: 'Khambhat Coast', distanceKm: 28, disease: 'HS (Septicemia)', caseCount: 6, riskLevel: 'Moderate', week: 'W40', trend: 'increasing', advisory: 'Avoid grazing near low-tide brackish water' }
];

const DISEASES = ['FMD (Foot & Mouth)', 'PPR (Goat Plague)', 'Lumpy Skin (LSD)', 'Mastitis (Bovine)', 'HS (Septicemia)'];
const REGIONS = ['Anand Central', 'Petlad Sub-cluster', 'Borsad Taluka', 'Umreth North', 'Khambhat Coast'];

export const RegionalDiseaseHeatmap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedDisease, setSelectedDisease] = useState<string>('All');
  const [selectedCell, setSelectedCell] = useState<OutbreakDataPoint | null>(null);
  const [viewTimeframe, setViewTimeframe] = useState<'7d' | '14d' | '30d'>('14d');
  const [showAdvisoryModal, setShowAdvisoryModal] = useState<boolean>(false);

  // Filtered dataset
  const filteredData = useMemo(() => {
    if (selectedDisease === 'All') return REGIONAL_OUTBREAK_DATA;
    return REGIONAL_OUTBREAK_DATA.filter(d => d.disease === selectedDisease);
  }, [selectedDisease]);

  // Overall stats
  const totalCases = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.caseCount, 0);
  }, [filteredData]);

  const highRiskCount = useMemo(() => {
    return filteredData.filter(d => d.riskLevel === 'High' || d.riskLevel === 'Severe').length;
  }, [filteredData]);

  // Render D3 Heatmap
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth || 360;
    const margin = { top: 30, right: 16, bottom: 45, left: 105 };
    const width = Math.max(340, containerWidth) - margin.left - margin.right;
    const height = 190 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale: Diseases (or Selected Disease)
    const currentDiseases = selectedDisease === 'All' ? DISEASES : [selectedDisease];
    const x = d3
      .scaleBand()
      .range([0, width])
      .domain(currentDiseases)
      .padding(0.08);

    // Y Scale: Regions
    const y = d3
      .scaleBand()
      .range([0, height])
      .domain(REGIONS)
      .padding(0.08);

    // Color Scale: Cream-Green -> Warm Amber -> Crimson Red
    const maxCases = d3.max(REGIONAL_OUTBREAK_DATA, d => d.caseCount) || 25;
    
    // Custom interpolator matching app palette: Light sage -> Amber (#F5A623) -> Deep Red (#C0392B)
    const colorScale = d3
      .scaleSequential()
      .interpolator(d3.interpolateRgbBasis(['#f0fdf4', '#fef3c7', '#f59e0b', '#dc2626']))
      .domain([0, maxCases]);

    // X Axis with shortened labels
    const xAxis = d3.axisBottom(x).tickFormat(d => {
      const match = d.match(/\(([^)]+)\)/);
      return match ? match[1] : d.split(' ')[0];
    });

    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('fill', '#4b5563');

    // Y Axis (Regions)
    const yAxis = d3.axisLeft(y).tickFormat(d => {
      return d.replace(' Sub-cluster', '').replace(' Taluka', '');
    });

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('fill', '#1f2937');

    // Remove axis tick lines for clean modern look
    g.selectAll('.domain').remove();
    g.selectAll('.tick line').remove();

    // Heatmap Rectangles
    g.selectAll('.heatmap-cell')
      .data(filteredData)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', d => x(d.disease) || 0)
      .attr('y', d => y(d.region) || 0)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', d => (d.caseCount === 0 ? '#f9fafb' : colorScale(d.caseCount)))
      .attr('stroke', d => (selectedCell?.region === d.region && selectedCell?.disease === d.disease ? '#1a3c2b' : '#e5e7eb'))
      .attr('stroke-width', d => (selectedCell?.region === d.region && selectedCell?.disease === d.disease ? 2.5 : 0.8))
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .attr('stroke', '#1a3c2b')
          .attr('stroke-width', 2);
        setSelectedCell(d);
      })
      .on('click', function (event, d) {
        setSelectedCell(d);
      });

    // Cell Text / Numbers
    g.selectAll('.heatmap-text')
      .data(filteredData)
      .enter()
      .append('text')
      .attr('class', 'heatmap-text')
      .attr('x', d => (x(d.disease) || 0) + x.bandwidth() / 2)
      .attr('y', d => (y(d.region) || 0) + y.bandwidth() / 2 + 3.5)
      .attr('text-anchor', 'middle')
      .style('font-size', currentDiseases.length > 2 ? '10px' : '12px')
      .style('font-weight', '700')
      .style('fill', d => (d.caseCount > 12 ? '#ffffff' : '#374151'))
      .style('pointer-events', 'none')
      .text(d => (d.caseCount === 0 ? '-' : d.caseCount));

  }, [filteredData, selectedDisease, selectedCell]);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3.5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-base">🗺️</span>
            <h2 className="text-base font-bold text-gray-900">Regional Outbreak Heatmap</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Anonymized D3 disease telemetry from Anand district clusters
          </p>
        </div>

        {/* Live sync pulse */}
        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Live Sync</span>
        </div>
      </div>

      {/* Metric Summary Chips */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded-xl p-2 border border-gray-100">
          <p className="text-[10px] text-gray-400 font-medium">Reported Cases</p>
          <p className="text-base font-bold text-gray-900 mt-0.5">{totalCases}</p>
          <p className="text-[9px] text-gray-500">Across 5 zones</p>
        </div>
        <div className="bg-red-50 rounded-xl p-2 border border-red-100">
          <p className="text-[10px] text-red-600 font-medium">High Risk Zones</p>
          <p className="text-base font-bold text-red-800 mt-0.5">{highRiskCount}</p>
          <p className="text-[9px] text-red-700">Near Anand</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-2 border border-amber-100">
          <p className="text-[10px] text-amber-700 font-medium">Nearest Outbreak</p>
          <p className="text-base font-bold text-amber-900 mt-0.5">4 km</p>
          <p className="text-[9px] text-amber-800">Anand Central (FMD)</p>
        </div>
      </div>

      {/* Disease Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {['All', ...DISEASES].map(d => {
          const isSelected = selectedDisease === d;
          const label = d === 'All' ? 'All Diseases' : d.split(' ')[0];
          return (
            <button
              key={d}
              onClick={() => {
                setSelectedDisease(d);
                setSelectedCell(null);
              }}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shadow-2xs"
              style={
                isSelected
                  ? { backgroundColor: '#1a3c2b', color: 'white' }
                  : { backgroundColor: '#f3f4f6', color: '#4b5563' }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* D3 Heatmap Canvas Container */}
      <div ref={containerRef} className="w-full overflow-x-auto bg-gray-50/50 rounded-xl p-2 border border-gray-100">
        <svg ref={svgRef} className="w-full block" />

        {/* Heatmap Legend */}
        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 px-1 border-t border-gray-200/60 mt-1">
          <span className="font-semibold text-gray-600">Case Density:</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-xs bg-[#f0fdf4] border border-gray-200" title="0-3 cases" />
            <span>0</span>
            <span className="inline-block w-3 h-3 rounded-xs bg-[#fef3c7]" title="4-8 cases" />
            <span>5</span>
            <span className="inline-block w-3 h-3 rounded-xs bg-[#f59e0b]" title="9-15 cases" />
            <span>12</span>
            <span className="inline-block w-3 h-3 rounded-xs bg-[#dc2626]" title="16+ cases" />
            <span className="font-bold text-red-700">20+</span>
          </div>
        </div>
      </div>

      {/* Selected Outbreak Detail Card / Interactive Tooltip */}
      {selectedCell ? (
        <div className="bg-emerald-950 text-white rounded-xl p-3 shadow-md space-y-2 animate-in fade-in duration-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-emerald-300">{selectedCell.region}</span>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-1.5 py-0.2 rounded-full">
                  {selectedCell.distanceKm} km away
                </span>
              </div>
              <p className="text-sm font-extrabold text-white mt-0.5">{selectedCell.disease}</p>
            </div>
            <div className="text-right">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor:
                    selectedCell.riskLevel === 'Severe' || selectedCell.riskLevel === 'High'
                      ? '#dc2626'
                      : selectedCell.riskLevel === 'Moderate'
                      ? '#d97706'
                      : '#16a34a',
                  color: 'white'
                }}
              >
                {selectedCell.riskLevel} Risk
              </span>
              <p className="text-[11px] font-bold text-emerald-200 mt-1">
                {selectedCell.caseCount} active cases
              </p>
            </div>
          </div>

          <div className="bg-emerald-900/70 rounded-lg p-2 text-[11px] text-emerald-100 flex items-start gap-1.5 border border-emerald-800">
            <span className="text-amber-400 font-bold flex-shrink-0">⚠️ Advisory:</span>
            <span>{selectedCell.advisory}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-emerald-400">
              Trend: {selectedCell.trend === 'increasing' ? '↗ Rising in ward' : selectedCell.trend === 'decreasing' ? '↘ Resolving' : '→ Stable'}
            </span>
            <button
              onClick={() => setShowAdvisoryModal(true)}
              className="text-[11px] font-bold text-amber-400 underline hover:text-amber-300 transition"
            >
              Protocol Guide →
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-2.5 text-center text-xs text-gray-500 border border-gray-100">
          💡 <span className="font-medium">Tip:</span> Tap any cell on the D3 heatmap to view quarantine radius and vet prevention protocol.
        </div>
      )}

      {/* Protocol Guide Modal */}
      {showAdvisoryModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Bio-Security Protocol
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">Outbreak Containment</h3>
              </div>
              <button
                onClick={() => setShowAdvisoryModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 font-bold flex items-center justify-center hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-gray-700">
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="font-bold text-amber-900">1. Ring Vaccination Perimeter</p>
                <p className="mt-0.5 text-amber-800">
                  With 14 cases within 4 km of Anand Central, boost unimmunized calves with FMD Trivalent booster immediately.
                </p>
              </div>

              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="font-bold text-gray-900">2. Disinfection of Shed Entry</p>
                <p className="mt-0.5 text-gray-600">
                  Install quicklime (calcium hydroxide) or potassium permanganate footbaths at barn entrances.
                </p>
              </div>

              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="font-bold text-gray-900">3. Isolate Incoming Cattle</p>
                <p className="mt-0.5 text-gray-600">
                  Do not introduce cattle purchased from Petlad or Borsad haats without a 14-day quarantine period.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAdvisoryModal(false)}
              className="w-full py-2.5 rounded-xl font-bold text-white text-xs shadow-md transition active:scale-95"
              style={{ backgroundColor: '#1a3c2b' }}
            >
              Understood & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionalDiseaseHeatmap;
