import { Topic, ModelPaper } from './types';

export const TOPICS: Topic[] = [
  { id: 'general-intro', title: 'राजस्थान - सामान्य परिचय', pageRange: '1 - 5' },
  { id: 'physical-division', title: 'राजस्थान - भौतिक विभाजन', pageRange: '6 - 13' },
  { id: 'climate', title: 'राजस्थान की जलवायु', pageRange: '14 - 18' },
  { id: 'soils', title: 'राजस्थान की मिट्टियाँ', pageRange: '19 - 22' },
  { id: 'drainage', title: 'राजस्थान का अपवाह तंत्र', pageRange: '23 - 29' },
  { id: 'dams', title: 'राजस्थान के प्रमुख बाँध', pageRange: '30 - 31' },
  { id: 'lakes', title: 'राजस्थान की झीलें', pageRange: '32 - 36' },
  { id: 'irrigation', title: 'सिंचाई परियोजनाएं', pageRange: '37 - 41' },
  { id: 'canals', title: 'राजस्थान की नहरें', pageRange: '42 - 45' },
  { id: 'forests', title: 'राजस्थान में वन सम्पदा', pageRange: '46 - 53' },
  { id: 'sanctuaries', title: 'राजस्थान में अभयारण्य', pageRange: '54 - 60' },
  { id: 'minerals', title: 'राजस्थान में खनिज', pageRange: '61 - 69' },
  { id: 'industries', title: 'राजस्थान के उद्योग', pageRange: '70 - 76' },
  { id: 'agriculture', title: 'राजस्थान में कृषि', pageRange: '77 - 85' },
  { id: 'census', title: 'राजस्थान की जनगणना', pageRange: '86 - 89' },
  { id: 'transport', title: 'राजस्थान में परिवहन', pageRange: '90 - 95' },
  { id: 'tourism', title: 'राजस्थान में पर्यटन', pageRange: '96 - 98' },
  { id: 'animal-husbandry', title: 'राजस्थान में पशुपालन', pageRange: '99 - 103' },
  { id: 'energy', title: 'राजस्थान में ऊर्जा संसाधन', pageRange: '104 - 108' },
  { id: 'drought', title: 'राजस्थान में सूखा - अकाल', pageRange: '109 - 110' },
  // Adding New Topics
  { id: 'history-intro', title: 'राजस्थान का इतिहास: एक परिचय', pageRange: '111 - 118' },
  { id: '1857-revolution', title: 'राजस्थान में 1857 की क्रांति', pageRange: '119 - 125' },
  { id: 'prajamandal', title: 'प्रजामंडल और किसान आंदोलन', pageRange: '126 - 135' },
  { id: 'integration', title: 'राजस्थान का एकीकरण', pageRange: '136 - 140' },
  { id: 'forts-monuments', title: 'राजस्थान के प्रमुख दुर्ग एवं स्मारक', pageRange: '141 - 150' },
  { id: 'fairs-festivals', title: 'राजस्थान के मेले एवं त्यौहार', pageRange: '151 - 158' },
  { id: 'folk-arts', title: 'लोक कलाएं, नृत्य एवं संगीत', pageRange: '159 - 168' },
  { id: 'biology-cell', title: 'जीव विज्ञान: कोशिका संरचना', pageRange: '169 - 175' },
  { id: 'genetics', title: 'आनुवंशिकी एवं जैव प्रौद्योगिकी', pageRange: '176 - 185' },
  { id: 'human-systems', title: 'मानव तंत्र (Digestive, Circulatory, etc.)', pageRange: '186 - 200' },
  { id: 'chemistry-atomic', title: 'रसायन विज्ञान: परमाणु संरचना', pageRange: '201 - 210' },
  { id: 'periodic-table', title: 'आवर्त सारणी एवं रासायनिक बंध', pageRange: '211 - 220' },
  { id: 'physics-optics', title: 'भौतिक विज्ञान: प्रकाशिकी (Optics)', pageRange: '221 - 230' },
  { id: 'physics-motion', title: 'गति एवं बल (Motion & Force)', pageRange: '231 - 240' },
  { id: 'current-affairs', title: 'राजस्थान समसामयिकी (Current Affairs)', pageRange: '241 - 255' },
  // More Topics Added
  { id: 'dynasties', title: 'राजस्थान के प्रमुख राजवंश', pageRange: '256 - 270' },
  { id: 'folk-deities', title: 'राजस्थान के लोक देवता एवं देवियाँ', pageRange: '271 - 280' },
  { id: 'saints-sects', title: 'राजस्थान के संत एवं सम्प्रदाय', pageRange: '281 - 288' },
  { id: 'attire-jewelry', title: 'राजस्थान की वेशभूषा एवं आभूषण', pageRange: '289 - 295' },
  { id: 'ecology', title: 'पारिस्थितिकी एवं पर्यावरण', pageRange: '296 - 305' },
  { id: 'plant-physiology', title: 'पादप कार्यिकी (Plant Physiology)', pageRange: '306 - 315' },
  { id: 'biomolecules', title: 'जैव अणु (Biomolecules)', pageRange: '316 - 322' },
  { id: 'hydrocarbons', title: 'हाइड्रोकार्बन एवं कार्बनिक रसायन', pageRange: '323 - 335' },
  { id: 'equilibrium', title: 'साम्यावस्था (Equilibrium)', pageRange: '336 - 345' },
  { id: 'gaseous-state', title: 'द्रव्य की अवस्थाएं (Gaseous State)', pageRange: '346 - 352' },
  { id: 'thermodynamics', title: 'ऊष्मागतिकी (Thermodynamics)', pageRange: '353 - 365' },
  { id: 'work-energy-power', title: 'कार्य, ऊर्जा और शक्ति', pageRange: '366 - 375' },
  { id: 'electrostatics', title: 'स्थिर वैद्युतिकी (Electrostatics)', pageRange: '376 - 385' },
  { id: 'current-electricity', title: 'धारा वैद्युतिकी (Current Electricity)', pageRange: '386 - 395' },
  { id: 'magnetism', title: 'चुम्बकत्व (Magnetism)', pageRange: '396 - 405' },
  { id: 'semiconductors', title: 'अर्धचालक इलेक्ट्रॉनिकी (Semiconductors)', pageRange: '406 - 415' },
  { id: 'environmental-chem', title: 'पर्यावरणीय रसायन (Environmental Chemistry)', pageRange: '416 - 422' },
  { id: 'polymers', title: 'बहुलक एवं दैनिक जीवन में रसायन', pageRange: '423 - 430' },
  { id: 'plant-anatomy', title: 'पादप शारीरिकी (Plant Anatomy)', pageRange: '431 - 440' },
  { id: 'economic-botany', title: 'आर्थिक वनस्पति विज्ञान', pageRange: '441 - 450' },
  { id: 'rajasthan-personalities', title: 'राजस्थान के प्रमुख व्यक्तित्व', pageRange: '451 - 460' },
  { id: 'tribal-movements', title: 'जनजातीय आंदोलन (Tribal Movements)', pageRange: '461 - 468' },
  { id: 'psychology-intro', title: 'शिक्षा मनोविज्ञान: एक परिचय', pageRange: '469 - 480' },
];

export const MODEL_PAPERS: ModelPaper[] = [
  { 
    id: 'p-2022', 
    year: '2022', 
    title: 'Lab Assistant 2022 (Solved)', 
    description: 'RSMSSB Lab Assistant 2022 Science Paper with Detailed Solutions' 
  },
  { 
    id: 'p-2018', 
    year: '2018', 
    title: 'Lab Assistant 2018 (Original)', 
    description: 'Previous Year Paper from 2018 examination session' 
  },
  { 
    id: 'p-2016', 
    year: '2016', 
    title: 'Lab Assistant 2016 (Re-exam)', 
    description: 'Archive paper for RPSC/RSMSSB Lab assistant preparation' 
  },
  { 
    id: 'p-2015', 
    year: '2015', 
    title: 'Lab Assistant 2015 (Full Paper)', 
    description: 'Comprehensive historical paper for trend analysis' 
  },
  { 
    id: 'model-1', 
    year: 'Latest', 
    title: 'Expert Model Paper 01', 
    description: 'Curated by top teachers for 2026 exam pattern (25+ Questions)' 
  },
  { 
    id: 'model-2', 
    year: 'Latest', 
    title: 'Expert Model Paper 02', 
    description: 'Advanced difficulty level for final stage revision' 
  },
  { 
    id: 'model-3', 
    year: 'Latest', 
    title: 'Psychology & General Knowledge Special', 
    description: 'Focus on new syllabus changes and pedagogical aspects' 
  },
  { 
    id: 'model-4', 
    year: 'Latest', 
    title: 'Science Super 25', 
    description: 'Intense practice set covering Physics, Chemistry, and Biology' 
  },
  { 
    id: 'model-5', 
    year: 'Latest', 
    title: 'Model Paper 05: History & Culture', 
    description: 'Deep dive into Rajasthan Art, Heritage and History' 
  },
  { 
    id: 'model-6', 
    year: 'Latest', 
    title: 'Model Paper 06: Rapid Fire Revision', 
    description: 'Quick questions covering the entire syllabus' 
  },
  { 
    id: 'numerical-special', 
    year: 'Science', 
    title: 'Physics & Chemistry Numericals', 
    description: 'Focus on calculations and formulas that appeared in previous years' 
  },
  { 
    id: 'gk-power-set', 
    year: '2026', 
    title: 'GK Power Pack 100', 
    description: '100 most expected General Knowledge questions for Rajasthan' 
  },
  { 
    id: 'bio-special', 
    year: 'Science', 
    title: 'Biology Concept Master', 
    description: 'Dedicated paper for Genetics, Human Physiology and Cell Biology' 
  },
  { 
    id: 'last-minute-hit', 
    year: 'V. Imp', 
    title: 'Last Minute Hit List', 
    description: 'Selected questions that are repeated most frequently in RSMSSB exams' 
  },
];
