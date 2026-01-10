import React, { useState, useRef } from 'react';
import './CaseSubmission.css';
import { apiClient } from './services/authService';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';

function CaseSubmission({ onSuccess, onClose }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    caseType: '',
    priority: '',
    state: '',
    district: '',
    expertiseTags: [],
    preferredLanguage: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [customCaseType, setCustomCaseType] = useState('');
  const [customLanguage, setCustomLanguage] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG`);
      } else if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large. Maximum size is 10MB`);
      } else {
        validFiles.push({
          file,
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type
        });
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
    e.target.value = ''; // Reset input
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    const fakeEvent = { target: { files } };
    handleFileSelect(fakeEvent);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const caseTypes = [
    'Civil Law',
    'Criminal Law',
    'Family Law',
    'Property Law',
    'Labor Law',
    'Constitutional Law',
    'Consumer Protection',
    'Human Rights',
    'Immigration',
    'Tax Law',
    'Environmental Law',
    'Other'
  ];

  const expertiseTagsMap = {
    'Civil Law': [
      'Property Dispute',
      'Breach of Contract',
      'Defamation',
      'Debt Recovery',
      'Tenant-Landlord Dispute',
      'Personal Injury',
      'Contract Dispute'
    ],
    'Criminal Law': [
      'Theft/Robbery',
      'Assault/Battery',
      'Fraud/Forgery',
      'Cyber Crime',
      'Murder/Attempt to Murder',
      'Drug offenses (NDPS)',
      'Fraud'
    ],
    'Family Law': [
      'Divorce',
      'Child Custody',
      'Domestic Violence',
      'Live-in Relationship Disputes',
      'Dowry Harassment',
      'Maintenance/Alimony',
      'Marriage Registration'
    ],
    'Property Law': [
      'Real Estate',
      'Land Acquisition',
      'Inheritance/Succession',
      'Property Registration',
      'Tenant Rights'
    ],
    'Labor Law': [
      'Wrongful Termination',
      'Wage Disputes',
      'Workplace Harassment',
      'Employment',
      'Labor Union Issues'
    ],
    'Constitutional Law': [
      'Fundamental Rights',
      'Writ Petitions',
      'PIL (Public Interest Litigation)',
      'Discrimination'
    ],
    'Consumer Protection': [
      'Product Defect',
      'Service Deficiency',
      'Unfair Trade Practices',
      'Insurance Claims'
    ],
    'Human Rights': [
      'Discrimination',
      'Police Brutality',
      'Freedom of Speech',
      'Right to Education'
    ],
    'Immigration': [
      'Visa Issues',
      'Deportation',
      'Citizenship',
      'Asylum/Refugee Status'
    ],
    'Tax Law': [
      'Income Tax',
      'GST',
      'Tax Evasion',
      'Corporate Tax'
    ],
    'Environmental Law': [
      'Pollution',
      'Wildlife Protection',
      'Forest Conservation',
      'Waste Management'
    ],
    'Other': [
      'General Legal Advice',
      'Mediation',
      'Arbitration',
      'Notary Services'
    ]
  };

  const getExpertiseTags = () => {
    if (!formData.caseType || formData.caseType === '') {
      // Show all tags if no type selected, or a default set
      return Object.values(expertiseTagsMap).flat().filter((value, index, self) => self.indexOf(value) === index).slice(0, 15);
    }
    return expertiseTagsMap[formData.caseType] || [];
  };

  const priorities = [
    { value: 'LOW', label: 'Low Priority' },
    { value: 'MEDIUM', label: 'Medium Priority' },
    { value: 'HIGH', label: 'High Priority' },
    { value: 'URGENT', label: 'Urgent' }
  ];

  const languages = [
    'English',
    'Spanish',
    'French',
    'Mandarin',
    'Hindi',
    'Arabic',
    'Portuguese',
    'Other'
  ];

  const statesAndDistricts = {
    'Andhra Pradesh': ['Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Krishna', 'Kurnool', 'Nellore', 'Prakasam', 'Srikakulam', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa'],
    'Arunachal Pradesh': ['Anjaw', 'Changlang', 'East Kameng', 'East Siang', 'Itanagar', 'Kurung Kumey', 'Lohit', 'Lower Subansiri', 'Papum Pare', 'Tawang', 'Tirap', 'Upper Siang', 'Upper Subansiri', 'West Kameng', 'West Siang'],
    'Assam': ['Baksa', 'Barpeta', 'Biswanath', 'Bongaigaon', 'Cachar', 'Charaideo', 'Chirang', 'Darrang', 'Dhemaji', 'Dhubri', 'Dibrugarh', 'Goalpara', 'Golaghat', 'Guwahati', 'Hailakandi', 'Hojai', 'Jorhat', 'Kamrup', 'Karbi Anglong', 'Karimganj', 'Kokrajhar', 'Lakhimpur', 'Majuli', 'Morigaon', 'Nagaon', 'Nalbari', 'Sivasagar', 'Sonitpur', 'Tinsukia', 'Udalguri'],
    'Bihar': ['Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur', 'Buxar', 'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 'Kaimur', 'Katihar', 'Khagaria', 'Kishanganj', 'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur', 'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa', 'Samastipur', 'Saran', 'Sheikhpura', 'Sheohar', 'Sitamarhi', 'Siwan', 'Supaul', 'Vaishali', 'West Champaran'],
    'Chhattisgarh': ['Balod', 'Baloda Bazar', 'Balrampur', 'Bastar', 'Bemetara', 'Bijapur', 'Bilaspur', 'Dantewada', 'Dhamtari', 'Durg', 'Gariaband', 'Janjgir-Champa', 'Jashpur', 'Kanker', 'Kabirdham', 'Kondagaon', 'Korba', 'Koriya', 'Mahasamund', 'Mungeli', 'Narayanpur', 'Raigarh', 'Raipur', 'Rajnandgaon', 'Sukma', 'Surajpur', 'Surguja'],
    'Goa': ['North Goa', 'South Goa'],
    'Gujarat': ['Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka', 'Gandhinagar', 'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch', 'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar', 'Tapi', 'Vadodara', 'Valsad'],
    'Haryana': ['Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurugram', 'Hisar', 'Jhajjar', 'Jind', 'Kaithal', 'Karnal', 'Kurukshetra', 'Mahendragarh', 'Nuh', 'Palwal', 'Panchkula', 'Panipat', 'Rewari', 'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar'],
    'Himachal Pradesh': ['Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kinnaur', 'Kullu', 'Lahaul and Spiti', 'Mandi', 'Shimla', 'Sirmaur', 'Solan', 'Una'],
    'Jharkhand': ['Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka', 'East Singhbhum', 'Garhwa', 'Giridih', 'Godda', 'Gumla', 'Hazaribagh', 'Jamtara', 'Khunti', 'Koderma', 'Latehar', 'Lohardaga', 'Pakur', 'Palamu', 'Ramgarh', 'Ranchi', 'Sahebganj', 'Seraikela Kharsawan', 'Simdega', 'West Singhbhum'],
    'Karnataka': ['Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir'],
    'Kerala': ['Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'],
    'Madhya Pradesh': ['Agar Malwa', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat', 'Barwani', 'Betul', 'Bhind', 'Bhopal', 'Burhanpur', 'Chhatarpur', 'Chhindwara', 'Damoh', 'Datia', 'Dewas', 'Dhar', 'Dindori', 'Guna', 'Gwalior', 'Harda', 'Hoshangabad', 'Indore', 'Jabalpur', 'Jhabua', 'Katni', 'Khandwa', 'Khargone', 'Mandla', 'Mandsaur', 'Morena', 'Narsinghpur', 'Neemuch', 'Panna', 'Raisen', 'Rajgarh', 'Ratlam', 'Rewa', 'Sagar', 'Satna', 'Sehore', 'Seoni', 'Shahdol', 'Shajapur', 'Sheopur', 'Shivpuri', 'Sidhi', 'Singrauli', 'Tikamgarh', 'Ujjain', 'Umaria', 'Vidisha'],
    'Maharashtra': ['Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'],
    'Manipur': ['Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East', 'Imphal West', 'Jiribam', 'Kakching', 'Kamjong', 'Kangpokpi', 'Noney', 'Pherzawl', 'Senapati', 'Tamenglong', 'Tengnoupal', 'Thoubal', 'Ukhrul'],
    'Meghalaya': ['East Garo Hills', 'East Jaintia Hills', 'East Khasi Hills', 'North Garo Hills', 'Ri Bhoi', 'South Garo Hills', 'South West Garo Hills', 'South West Khasi Hills', 'West Garo Hills', 'West Jaintia Hills', 'West Khasi Hills'],
    'Mizoram': ['Aizawl', 'Champhai', 'Kolasib', 'Lawngtlai', 'Lunglei', 'Mamit', 'Saiha', 'Serchhip'],
    'Nagaland': ['Dimapur', 'Kiphire', 'Kohima', 'Longleng', 'Mokokchung', 'Mon', 'Peren', 'Phek', 'Tuensang', 'Wokha', 'Zunheboto'],
    'Odisha': ['Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh', 'Cuttack', 'Deogarh', 'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur', 'Jajpur', 'Jharsuguda', 'Kalahandi', 'Kandhamal', 'Kendrapara', 'Kendujhar', 'Khordha', 'Koraput', 'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh', 'Nuapada', 'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh'],
    'Punjab': ['Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka', 'Ferozepur', 'Gurdaspur', 'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana', 'Mansa', 'Moga', 'Mohali', 'Muktsar', 'Pathankot', 'Patiala', 'Rupnagar', 'Sangrur', 'Shaheed Bhagat Singh Nagar', 'Tarn Taran'],
    'Rajasthan': ['Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Bundi', 'Chittorgarh', 'Churu', 'Dausa', 'Dholpur', 'Dungarpur', 'Hanumangarh', 'Jaipur', 'Jaisalmer', 'Jalore', 'Jhalawar', 'Jhunjhunu', 'Jodhpur', 'Karauli', 'Kota', 'Nagaur', 'Pali', 'Pratapgarh', 'Rajsamand', 'Sawai Madhopur', 'Sikar', 'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur'],
    'Sikkim': ['East Sikkim', 'North Sikkim', 'South Sikkim', 'West Sikkim'],
    'Tamil Nadu': ['Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'],
    'Telangana': ['Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagtial', 'Jangaon', 'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam', 'Kumuram Bheem', 'Mahabubabad', 'Mahabubnagar', 'Mancherial', 'Medak', 'Medchal–Malkajgiri', 'Mulugu', 'Nagarkurnool', 'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal Rural', 'Warangal Urban', 'Yadadri Bhuvanagiri'],
    'Tripura': ['Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala', 'South Tripura', 'Unakoti', 'West Tripura'],
    'Uttar Pradesh': ['Agra', 'Aligarh', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya', 'Ayodhya', 'Azamgarh', 'Baghpat', 'Bahraich', 'Ballia', 'Balrampur', 'Banda', 'Barabanki', 'Bareilly', 'Basti', 'Bhadohi', 'Bijnor', 'Budaun', 'Bulandshahr', 'Chandauli', 'Chitrakoot', 'Deoria', 'Etah', 'Etawah', 'Farrukhabad', 'Fatehpur', 'Firozabad', 'Gautam Buddha Nagar', 'Ghaziabad', 'Ghazipur', 'Gonda', 'Gorakhpur', 'Hamirpur', 'Hapur', 'Hardoi', 'Hathras', 'Jalaun', 'Jaunpur', 'Jhansi', 'Kannauj', 'Kanpur Dehat', 'Kanpur Nagar', 'Kasganj', 'Kaushambi', 'Kushinagar', 'Lakhimpur Kheri', 'Lalitpur', 'Lucknow', 'Maharajganj', 'Mahoba', 'Mainpuri', 'Mathura', 'Mau', 'Meerut', 'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Pratapgarh', 'Prayagraj', 'Raebareli', 'Rampur', 'Saharanpur', 'Sambhal', 'Sant Kabir Nagar', 'Shahjahanpur', 'Shamli', 'Shravasti', 'Siddharthnagar', 'Sitapur', 'Sonbhadra', 'Sultanpur', 'Unnao', 'Varanasi'],
    'Uttarakhand': ['Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun', 'Haridwar', 'Nainital', 'Pauri Garhwal', 'Pithoragarh', 'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar', 'Uttarkashi'],
    'West Bengal': ['Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur', 'Darjeeling', 'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram', 'Kalimpong', 'Kolkata', 'Malda', 'Murshidabad', 'Nadia', 'North 24 Parganas', 'Paschim Bardhaman', 'Paschim Medinipur', 'Purba Bardhaman', 'Purba Medinipur', 'Purulia', 'South 24 Parganas', 'Uttar Dinajpur'],
    'Andaman and Nicobar Islands': ['Nicobar', 'North and Middle Andaman', 'South Andaman'],
    'Chandigarh': ['Chandigarh'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Dadra and Nagar Haveli', 'Daman', 'Diu'],
    'Delhi': ['Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi'],
    'Jammu and Kashmir': ['Anantnag', 'Bandipora', 'Baramulla', 'Budgam', 'Doda', 'Ganderbal', 'Jammu', 'Kathua', 'Kishtwar', 'Kulgam', 'Kupwara', 'Poonch', 'Pulwama', 'Rajouri', 'Ramban', 'Reasi', 'Samba', 'Shopian', 'Srinagar', 'Udhampur'],
    'Ladakh': ['Kargil', 'Leh'],
    'Lakshadweep': ['Lakshadweep'],
    'Puducherry': ['Karaikal', 'Mahe', 'Puducherry', 'Yanam']
  };

  const getDistricts = () => {
    if (!formData.state) return [];
    return statesAndDistricts[formData.state] || [];
  };

  const steps = [
    { number: 1, title: 'Details' },
    { number: 2, title: 'Location & Parties' },
    { number: 3, title: 'Evidence' },
    { number: 4, title: 'Review' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Reset district when state changes
    if (name === 'state') {
      setFormData(prev => ({ ...prev, state: value, district: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleExpertiseTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      expertiseTags: prev.expertiseTags.includes(tag)
        ? prev.expertiseTags.filter(t => t !== tag)
        : [...prev.expertiseTags, tag]
    }));
  };

  const addCustomTag = () => {
    const trimmedTag = customTag.trim();
    if (trimmedTag && !formData.expertiseTags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        expertiseTags: [...prev.expertiseTags, trimmedTag]
      }));
      setCustomTag('');
    }
  };

  const removeExpertiseTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      expertiseTags: prev.expertiseTags.filter(t => t !== tagToRemove)
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Case title is required';
    } else if (formData.title.trim().length < 10) {
      newErrors.title = 'Title should be at least 10 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Case summary is required';
    } else if (formData.description.trim().length < 50) {
      newErrors.description = 'Please provide at least 50 characters describing your case';
    }

    if (!formData.caseType) {
      newErrors.caseType = 'Please select a case type';
    }

    if (formData.expertiseTags.length === 0) {
      newErrors.expertiseTags = 'Please select at least one expertise tag';
    }

    if (!formData.preferredLanguage) {
      newErrors.preferredLanguage = 'Please select your preferred language';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.state) {
      newErrors.state = 'Please select a state';
    }

    if (!formData.district) {
      newErrors.district = 'Please select a district';
    }

    if (!formData.priority) {
      newErrors.priority = 'Please select case priority';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    if (currentStep === 2 && !validateStep2()) {
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem('caseDraft', JSON.stringify(formData));
    alert('Draft saved successfully! You can continue later from where you left off.');
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove data:image/png;base64, etc.
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    // Validate consent checkboxes
    if (!confirmAccurate || !agreeTerms) {
      setErrors({ submit: 'Please accept both consent checkboxes before submitting.' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('Starting case submission...');
      console.log('Form data:', formData);
      
      // Map frontend data to backend CreateCaseRequest DTO
      const attachments = uploadedFiles.length > 0 
        ? await Promise.all(
            uploadedFiles.map(async (fileObj) => {
              try {
                const base64Content = await fileToBase64(fileObj.file);
                return {
                  name: fileObj.name,
                  type: fileObj.type,
                  content: base64Content
                };
              } catch (fileError) {
                console.error('Error processing file:', fileObj.name, fileError);
                throw new Error(`Failed to process file: ${fileObj.name}`);
              }
            })
          )
        : [];

      const caseData = {
        title: formData.title,
        description: formData.description,
        caseType: formData.caseType === 'Other' ? customCaseType : formData.caseType,
        priority: formData.priority,
        location: `${formData.district}, ${formData.state}`,
        expertiseTags: formData.expertiseTags,
        preferredLanguage: formData.preferredLanguage === 'Other' ? customLanguage : formData.preferredLanguage,
        attachments: attachments
      };

      console.log('Submitting case data:', { ...caseData, attachments: `${attachments.length} files` });

      const response = await apiClient.post('/cases', caseData);

      console.log('Case submission response:', response);

      if (response.status === 200 || response.status === 201) {
        alert('Case submitted successfully!');
        localStorage.removeItem('caseDraft');
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }
    } catch (error) {
      console.error('Error submitting case:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Failed to submit case. Please try again.';
      
      if (error.message && error.message.includes('Failed to process file')) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error' || !error.response) {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running on port 8080.';
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="case-steps-container">
      <div className="case-steps-progress">
        <div
          className="case-steps-progress-bar"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>
      <div className="case-steps">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`case-step ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''
              }`}
          >
            <div className="case-step-number">
              {currentStep > step.number ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.3337 4L6.00033 11.3333L2.66699 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <div className="case-step-title">{step.title}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="case-form-step">
      <div className="case-form-section">
        <label className="case-form-label">
          Case Title <span className="required">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Brief title for your case"
          className={`case-form-input ${errors.title ? 'error' : ''}`}
        />
        {errors.title && <span className="error-message">{errors.title}</span>}
      </div>

      <div className="case-form-section">
        <label className="case-form-label">
          Case Summary <span className="required">*</span>
          <span className="label-hint">(in plain language)</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Briefly describe your situation, who is involved, and what outcome you are seeking.&#10;&#10;Focus on clarity and key facts. Avoid legal jargon."
          className={`case-form-textarea ${errors.description ? 'error' : ''}`}
          rows="6"
        />
        {errors.description && <span className="error-message">{errors.description}</span>}
        <div className="char-count">{formData.description.length} characters</div>
      </div>

      <div className="case-form-section">
        <label className="case-form-label">
          Case Type <span className="required">*</span>
        </label>
        <select
          name="caseType"
          value={formData.caseType}
          onChange={handleChange}
          className={`case-form-select ${errors.caseType ? 'error' : ''}`}
        >
          <option value="">Select case type</option>
          {caseTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        {formData.caseType === 'Other' && (
          <input
            type="text"
            value={customCaseType}
            onChange={(e) => setCustomCaseType(e.target.value)}
            placeholder="Please specify case type"
            className="case-form-input"
            style={{ marginTop: '12px' }}
          />
        )}
        {errors.caseType && <span className="error-message">{errors.caseType}</span>}
      </div>

      <div className="case-form-section">
        <label className="case-form-label">
          Expertise Tags <span className="required">*</span>
        </label>

        {/* Selected Tags */}
        {formData.expertiseTags.length > 0 && (
          <div className="selected-tags">
            {formData.expertiseTags.map(tag => (
              <span key={tag} className="selected-tag">
                {tag}
                <button
                  type="button"
                  onClick={() => removeExpertiseTag(tag)}
                  className="remove-tag-btn"
                  aria-label="Remove tag"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Predefined Tags */}
        <div className="expertise-tags">
          {getExpertiseTags().map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleExpertiseTag(tag)}
              className={`expertise-tag ${formData.expertiseTags.includes(tag) ? 'selected' : ''}`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Custom Tag Input */}
        <div className="custom-tag-input">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
            placeholder="Type custom tag and press Enter"
            className="case-form-input"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="add-tag-btn"
          >
            Add
          </button>
        </div>

        <p className="field-hint">Select from options above or add your own custom tag.</p>
        {errors.expertiseTags && <span className="error-message">{errors.expertiseTags}</span>}
      </div>

      <div className="case-form-section">
        <label className="case-form-label">
          Preferred Language <span className="required">*</span>
        </label>
        <select
          name="preferredLanguage"
          value={formData.preferredLanguage}
          onChange={handleChange}
          className={`case-form-select ${errors.preferredLanguage ? 'error' : ''}`}
        >
          <option value="">Select preferred language</option>
          {languages.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
        {formData.preferredLanguage === 'Other' && (
          <input
            type="text"
            value={customLanguage}
            onChange={(e) => setCustomLanguage(e.target.value)}
            placeholder="Please specify language"
            className="case-form-input"
            style={{ marginTop: '12px' }}
          />
        )}
        {errors.preferredLanguage && <span className="error-message">{errors.preferredLanguage}</span>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="case-form-step">
      <div className="case-form-section">
        <label className="case-form-label">
          Location <span className="required">*</span>
        </label>
        <p className="field-hint" style={{ marginBottom: '12px' }}>This helps us connect you with local legal assistance.</p>
        
        <div className="location-dropdowns">
          <div className="location-field">
            <label className="location-sub-label">State <span className="required">*</span></label>
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              className={`case-form-select ${errors.state ? 'error' : ''}`}
            >
              <option value="">Select State</option>
              {Object.keys(statesAndDistricts).sort().map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            {errors.state && <span className="error-message">{errors.state}</span>}
          </div>
          
          <div className="location-field">
            <label className="location-sub-label">District <span className="required">*</span></label>
            <select
              name="district"
              value={formData.district}
              onChange={handleChange}
              className={`case-form-select ${errors.district ? 'error' : ''}`}
              disabled={!formData.state}
            >
              <option value="">{formData.state ? 'Select District' : 'Select State First'}</option>
              {getDistricts().map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
            {errors.district && <span className="error-message">{errors.district}</span>}
          </div>
        </div>
      </div>

      <div className="case-form-section">
        <label className="case-form-label">
          Case Priority <span className="required">*</span>
        </label>
        <div className="priority-options">
          {priorities.map(priority => (
            <label key={priority.value} className="priority-option">
              <input
                type="radio"
                name="priority"
                value={priority.value}
                checked={formData.priority === priority.value}
                onChange={handleChange}
              />
              <span className={`priority-label priority-${priority.value.toLowerCase()}`}>
                {priority.label}
              </span>
            </label>
          ))}
        </div>
        {errors.priority && <span className="error-message">{errors.priority}</span>}
      </div>

      <div className="case-form-section">
        <label className="case-form-label">
          Additional Parties Involved <span className="optional">(Optional)</span>
        </label>
        <textarea
          name="parties"
          value={formData.parties || ''}
          onChange={handleChange}
          placeholder="List any other parties involved in this case (e.g., opposing party, witnesses, etc.)"
          className="case-form-textarea"
          rows="3"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="case-form-step">
      <div className="case-evidence-section">
        <div className="evidence-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3>Evidence & Documents</h3>
        <p className="evidence-description">
          Upload any relevant documents that support your case. This could include contracts,
          emails, photographs, police reports, or any other evidence.
        </p>

        <div
          className="upload-area"
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
          />
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="upload-text">
            <strong>Click to upload</strong> or drag and drop
          </p>
          <p className="upload-hint">PDF, DOC, DOCX, JPG, PNG (Max 10MB per file)</p>
          <button type="button" className="upload-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Choose Files</button>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="uploaded-files-list">
            <h4>Uploaded Files ({uploadedFiles.length})</h4>
            {uploadedFiles.map(file => (
              <div key={file.id} className="uploaded-file-item">
                <div className="file-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
                <button type="button" className="remove-file-btn" onClick={() => removeFile(file.id)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="info-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong>Privacy & Security</strong>
            <p>All documents are encrypted and stored securely. Only you and your matched legal professionals can access them.</p>
          </div>
        </div>

        <p className="skip-note">You can skip this step and upload documents later if needed.</p>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="case-form-step">
      <div className="review-section">
        <h3 className="review-title">Review Your Submission</h3>
        <p className="review-subtitle">Please review all information before submitting</p>

        <div className="review-card">
          <div className="review-header">
            <h4>Case Details</h4>
            <button type="button" onClick={() => setCurrentStep(1)} className="edit-btn">
              Edit
            </button>
          </div>
          <div className="review-item">
            <span className="review-label">Case Type:</span>
            <span className="review-value">{formData.caseType || 'Not specified'}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Summary:</span>
            <span className="review-value">{formData.description || 'Not provided'}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Expertise Tags:</span>
            <div className="review-tags">
              {formData.expertiseTags.length > 0 ? formData.expertiseTags.map(tag => (
                <span key={tag} className="review-tag">{tag}</span>
              )) : 'None selected'}
            </div>
          </div>
          <div className="review-item">
            <span className="review-label">Preferred Language:</span>
            <span className="review-value">{formData.preferredLanguage || 'Not specified'}</span>
          </div>
        </div>

        <div className="review-card">
          <div className="review-header">
            <h4>Location & Priority</h4>
            <button type="button" onClick={() => setCurrentStep(2)} className="edit-btn">
              Edit
            </button>
          </div>
          <div className="review-item">
            <span className="review-label">Title:</span>
            <span className="review-value">{formData.title || 'Not provided'}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Location:</span>
            <span className="review-value">{formData.location || 'Not specified'}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Priority:</span>
            <span className={`review-value priority-badge priority-${(formData.priority || 'medium').toLowerCase()}`}>
              {formData.priority || 'Not set'}
            </span>
          </div>
        </div>

        <div className="consent-section">
          <label className="consent-checkbox">
            <input 
              type="checkbox" 
              checked={confirmAccurate}
              onChange={(e) => setConfirmAccurate(e.target.checked)}
              required 
            />
            <span>
              I confirm that all information provided is accurate and I understand that
              providing false information may affect my case.
            </span>
          </label>
          <label className="consent-checkbox">
            <input 
              type="checkbox" 
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required 
            />
            <span>
              I agree to the{' '}
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setShowTerms(true);
                }}
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setShowPrivacy(true);
                }}
              >
                Privacy Policy
              </a>
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="case-submission-content">
        <div className="case-content-wrapper">
          {renderStepIndicator()}

          <div className="case-form-content">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          <div className="case-submission-footer">
            <div className="footer-left">
              {currentStep < 4 && (
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="case-btn case-btn-secondary"
                >
                  Save Draft
                </button>
              )}
            </div>
            <div className="footer-right">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="case-btn case-btn-outline"
                >
                  Back
                </button>
              )}
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="case-btn case-btn-primary"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !confirmAccurate || !agreeTerms}
                  className="case-btn case-btn-primary"
                  title={!confirmAccurate || !agreeTerms ? 'Please accept both checkboxes to submit' : ''}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Case'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <TermsOfService isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyPolicy isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </>
  );
}

export default CaseSubmission;
