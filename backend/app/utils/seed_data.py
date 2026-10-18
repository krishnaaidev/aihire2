import json
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.interview import Interview
from app.models.question import Question
from app.models.response import CandidateResponse
from app.models.report import EvaluationReport
from app.utils.security import hash_password

RECRUITER_DATA = [
    # 1. Mechanical Engineering - Experienced
    {
        "name": "Er. Vikramaditya Rathore",
        "email": "vikram.mech@aihire.com",
        "branch": "Mechanical Engineering",
        "field": "CAD/CAM & Industrial Machinery",
        "job_title": "Senior Mechanical Design & Simulation Engineer",
        "department": "Mechanical Systems & Product Design",
        "description": "Lead the end-to-end design, FEA structural stress simulation, and manufacturing tolerance analysis for high-precision industrial robotics and automation hardware.",
        "required_skills": ["SolidWorks", "ANSYS FEA", "GD&T", "Thermodynamics", "AutoCAD", "DFM/DFA"],
        "preferred_skills": ["Catia", "CFD", "Additive Manufacturing", "Matlab", "Sheet Metal Design"],
        "experience": "4-7 years",
        "experience_level": "Mid-Senior Level",
        "salary_range": "₹12.0 - ₹18.5 LPA",
        "location": "Pune, Maharashtra",
        "work_mode": "On-Site (Design Studio)",
        "openings": 4,
        "employment_type": "Full-Time, Permanent",
        "education": "B.Tech / M.Tech in Mechanical / Mechatronics Engineering",
        "eligibility": "B.Tech/M.Tech in Mechanical Engineering with minimum 65% aggregate. Proven proficiency in CAD modeling (SolidWorks/Catia) and finite element analysis (ANSYS).",
        "selection_process": "Round 1: AI Resume Parsing & Automated Shortlisting → Round 2: AI Voice/Text Technical Interview on DFM & Stress Analysis → Round 3: CAD Modeling & Design Review → Round 4: Executive Interview",
        "responsibilities": "Generate 3D CAD models and assembly drawings adhering strictly to ASME Y14.5 standards. Perform static, fatigue, and thermal stress simulations using ANSYS. Collaborate with manufacturing partners for rapid prototyping and DFM/DFA optimization."
    },

    # 2. Mechanical Engineering - FRESHER ROLE
    {
        "name": "Prof. Harpreet Kaur",
        "email": "harpreet.getmech@aihire.com",
        "branch": "Mechanical Engineering",
        "field": "Thermal, Manufacturing & Quality Trainee",
        "job_title": "Graduate Engineer Trainee (GET) - Mechanical",
        "department": "Plant Engineering & Production Operations",
        "description": "Ideal launchpad for ambitious 2024-2026 mechanical graduates. You will be cross-trained in CNC machining, thermal power cycle evaluation, assembly line optimization, and ISO-9001 quality compliance.",
        "required_skills": ["Engineering Drawing", "Thermodynamics", "AutoCAD", "Fluid Mechanics", "Strength of Materials", "MS Office"],
        "preferred_skills": ["SolidWorks Basics", "Six Sigma Basics", "Industrial Safety", "Python for Engineering"],
        "experience": "Fresher (0-1 years)",
        "experience_level": "Fresher",
        "salary_range": "₹4.5 - ₹6.5 LPA + Performance Incentives",
        "location": "Chennai, Tamil Nadu / Gurugram, NCR",
        "work_mode": "On-Site (Manufacturing Plant)",
        "openings": 15,
        "employment_type": "Full-Time (GET leading to Assistant Manager)",
        "education": "B.Tech / B.E. in Mechanical / Production / Industrial Engineering (2024-2026 Batch)",
        "eligibility": "Graduates of 2024, 2025, or 2026 batch. Minimum 60% or 6.5 CGPA in 10th, 12th, and B.Tech with no active backlogs. High spatial reasoning and solid command of core mechanical subjects.",
        "selection_process": "Round 1: AI Resume Matching & Screening → Round 2: AI Hire Core Mechanical Interview (Thermodynamics, Strength of Materials) → Round 3: Technical Viva & Plant Aptitude → Round 4: HR Onboarding",
        "responsibilities": "Support senior engineers in production line monitoring, cycle-time reduction, and failure mode effects analysis (FMEA). Prepare 2D/3D fabrication drawings and inspect incoming parts for dimensional accuracy."
    },

    # 3. Civil Engineering - Experienced
    {
        "name": "Er. Bhupinder Singh",
        "email": "bhupinder.civil@aihire.com",
        "branch": "Civil Engineering",
        "field": "Structural Engineering & Smart Infrastructure",
        "job_title": "Lead Structural Analysis & BIM Infrastructure Engineer",
        "department": "Smart Infrastructure & Urban Works",
        "description": "Supervise structural analysis, seismic risk assessment, and integrated BIM modeling for multi-story civic structures and transport infrastructure.",
        "required_skills": ["STAAD.Pro", "ETABS", "BIM (Revit)", "Concrete Design", "Steel Structures", "IS Codes"],
        "preferred_skills": ["Primavera P6", "Geotechnical Analysis", "Seismic Engineering", "AutoCAD Civil 3D"],
        "experience": "4-8 years",
        "experience_level": "Mid-Senior Level",
        "salary_range": "₹11.0 - ₹17.0 LPA",
        "location": "Noida / Delhi NCR",
        "work_mode": "Hybrid (Site & Office)",
        "openings": 5,
        "employment_type": "Full-Time, Permanent",
        "education": "B.Tech / M.Tech in Civil / Structural Engineering",
        "eligibility": "B.Tech/M.Tech in Civil Engineering with strong track record in RCC and steel structure design adhering to IS 456, IS 800, and IS 1893 seismic codes.",
        "selection_process": "Round 1: AI Automated Resume Evaluation → Round 2: AI Structural Engineering Interview → Round 3: Live Case Study & STAAD.Pro Drawing Defense → Round 4: Management Discussion",
        "responsibilities": "Design safe and cost-effective RCC and steel structural systems. Perform static and dynamic seismic analyses using ETABS. Coordinate architectural clash detections using Autodesk Revit BIM."
    },

    # 4. Civil Engineering - FRESHER ROLE
    {
        "name": "Er. Meenakshi Sundaram",
        "email": "meenakshi.getcivil@aihire.com",
        "branch": "Civil Engineering",
        "field": "Construction Site Management & Surveying",
        "job_title": "Junior Civil Site & Survey Engineer (Fresher)",
        "department": "Civil Infrastructure & Site Execution",
        "description": "Kickstart your civil engineering career managing on-ground construction milestones, total station land surveying, concrete batch quality audits, and bar bending schedule (BBS) verification.",
        "required_skills": ["AutoCAD", "Surveying & Leveling", "Building Construction Materials", "Concrete Technology", "Estimation & Costing"],
        "preferred_skills": ["Total Station Operation", "MS Excel", "Basic STAAD.Pro", "Site Safety Protocols"],
        "experience": "Fresher (0-1 years)",
        "experience_level": "Fresher",
        "salary_range": "₹4.0 - ₹5.8 LPA + Site Allowances",
        "location": "Bengaluru / Hyderabad / Mohali",
        "work_mode": "On-Site (Project Site)",
        "openings": 12,
        "employment_type": "Full-Time",
        "education": "B.Tech / B.E. / Diploma in Civil Engineering (2024-2026 Batch)",
        "eligibility": "B.Tech or Diploma in Civil Engineering (2024, 2025, or 2026 passing out). Minimum 58% or 6.0 CGPA. Willingness to work on infrastructure and construction project sites.",
        "selection_process": "Round 1: AI Resume Verification → Round 2: AI Civil Technical Interview (Surveying, Mix Design, BBS) → Round 3: Technical Site Assessment → Round 4: HR Offer",
        "responsibilities": "Assist site in-charge with daily progress reports (DPR), material reconciliation, and cube testing. Interpret architectural and structural blueprints to guide mason and contractor crews."
    },

    # 5. Electrical & Electronics Engineering (EEE) - Experienced
    {
        "name": "Dr. K. Swaminathan",
        "email": "swaminathan.eee@aihire.com",
        "branch": "Electrical & Electronics Engineering",
        "field": "Power Systems & Renewable Energy Microgrids",
        "job_title": "Senior Power Systems & Smart Grid Engineer",
        "department": "Renewable Energy & Power Distribution",
        "description": "Architect high-voltage substation switchgear, renewable solar/wind grid integrations, battery energy storage systems (BESS), and smart metering telemetry.",
        "required_skills": ["MATLAB/Simulink", "Power Systems", "ETAP", "High Voltage Switchgear", "PLC/SCADA", "Protection Relays"],
        "preferred_skills": ["BESS Design", "Solar PV Simulation (PVsyst)", "Microgrid Controllers", "IEC 61850"],
        "experience": "5-8 years",
        "experience_level": "Senior Lead",
        "salary_range": "₹14.0 - ₹22.0 LPA",
        "location": "Bengaluru, Karnataka",
        "work_mode": "Hybrid",
        "openings": 3,
        "employment_type": "Full-Time, Permanent",
        "education": "B.Tech / M.Tech in Electrical & Electronics Engineering (EEE)",
        "eligibility": "B.Tech / M.Tech in EEE. Minimum 5 years experience in power system modeling, load flow analysis using ETAP, and protective relay coordination.",
        "selection_process": "Round 1: AI Resume Filtering → Round 2: AI Power Engineering Interview → Round 3: ETAP Simulation Case Study → Round 4: Leadership Fit",
        "responsibilities": "Execute load flow, short circuit, and motor starting studies using ETAP. Formulate protection relay coordination curves and commission remote SCADA RTUs."
    },

    # 6. Electrical & Electronics Engineering (EEE) - FRESHER ROLE
    {
        "name": "Er. Ananya Mukherjee",
        "email": "ananya.geteee@aihire.com",
        "branch": "Electrical & Electronics Engineering",
        "field": "Electrical Maintenance & Power Distribution",
        "job_title": "Graduate Electrical Engineer Trainee (Fresher)",
        "department": "Industrial Electrification & Drives",
        "description": "Entry-level opportunity for electrical graduates to gain hands-on expertise in industrial motor drives, transformer maintenance, single-line diagrams (SLD), and energy auditing.",
        "required_skills": ["Electrical Machines", "Circuit Theory", "Power Electronics", "AutoCAD Electrical", "Transformers & Motors"],
        "preferred_skills": ["Basic MATLAB", "PLC Basics", "Panel Wiring", "National Electrical Code (NEC)"],
        "experience": "Fresher (0-1 years)",
        "experience_level": "Fresher",
        "salary_range": "₹4.5 - ₹6.2 LPA",
        "location": "Ahmedabad / Vadodara / Pune",
        "work_mode": "On-Site (Industrial Plant)",
        "openings": 10,
        "employment_type": "Full-Time Trainee",
        "education": "B.Tech / B.E. in Electrical / Electrical & Electronics Engineering (2024-2026 Batch)",
        "eligibility": "B.Tech in EEE/EE graduated in 2024, 2025, or passing in 2026. Minimum 60% with sound conceptual grasp of induction motors, synchronous machines, and circuit laws.",
        "selection_process": "Round 1: AI Resume Parsing → Round 2: AI Electrical Interview on Circuit Theorems & Power Devices → Round 3: Technical Viva → Round 4: HR Final",
        "responsibilities": "Inspect electrical panels, verify single-line schematics, test transformer insulation resistance, and calibrate motor protection overloads under senior mentorship."
    },

    # 7. Electronics & Communication (ECE) - Experienced
    {
        "name": "Rohit Kapoor",
        "email": "rohit.iot@aihire.com",
        "branch": "Electronics & Communication Engineering",
        "field": "Embedded Systems & Edge IoT",
        "job_title": "Lead Embedded Firmware & RTOS Engineer",
        "department": "Connected Hardware & Edge Computing",
        "description": "Develop mission-critical bare-metal and FreeRTOS firmware for low-power ARM Cortex-M microcontrollers, wireless telemetry, and industrial IoT gateways.",
        "required_skills": ["Embedded C", "C++", "FreeRTOS", "ARM Cortex-M", "SPI/I2C/UART", "Oscilloscopes"],
        "preferred_skills": ["BLE / Zigbee", "MQTT", "ESP32", "OTA Firmware Updates", "PCB Layout"],
        "experience": "3-6 years",
        "experience_level": "Mid-Senior Level",
        "salary_range": "₹10.5 - ₹16.5 LPA",
        "location": "Bengaluru / Hyderabad",
        "work_mode": "Hybrid",
        "openings": 4,
        "employment_type": "Full-Time, Permanent",
        "education": "B.Tech / M.Tech in ECE / Embedded Systems",
        "eligibility": "Degree in Electronics & Communication or related field with proven expertise in C/C++ firmware, device drivers, and real-time scheduling.",
        "selection_process": "Round 1: AI Resume Scan → Round 2: AI Embedded Systems & RTOS Interview → Round 3: Live Firmware Architecture & Code Review → Round 4: Final HR",
        "responsibilities": "Author board support packages (BSP), optimize interrupt service routines (ISR), ensure ultra-low power sleep states, and debug hardware via JTAG/SWD."
    },

    # 8. Electronics & Communication (ECE) - FRESHER ROLE
    {
        "name": "Alok Deshmukh",
        "email": "alok.vlsi@aihire.com",
        "branch": "Electronics & Communication Engineering",
        "field": "VLSI Design & Digital Verification Trainee",
        "job_title": "Junior VLSI Verification & FPGA Trainee (Fresher)",
        "department": "Silicon & Semiconductor Engineering",
        "description": "Prestigious opportunity for passionate 2024-2026 ECE graduates to enter the semiconductor industry. Learn RTL coding in Verilog, simulation testbenches, and FPGA synthesis.",
        "required_skills": ["Digital Electronics", "Verilog HDL", "C Programming", "Boolean Algebra", "Flip-Flops & FSMs"],
        "preferred_skills": ["SystemVerilog Basics", "FPGA Vivado Basics", "Python Scripting", "Static Timing Analysis"],
        "experience": "Fresher (0-1 years)",
        "experience_level": "Fresher",
        "salary_range": "₹5.5 - ₹8.0 LPA",
        "location": "Bengaluru / Noida",
        "work_mode": "Hybrid / Lab-Based",
        "openings": 8,
        "employment_type": "Full-Time (VLSI Trainee Program)",
        "education": "B.Tech / B.E. in Electronics & Communication / VLSI / Microelectronics (2024-2026)",
        "eligibility": "2024-2026 passing out batch. Minimum 65% or 6.8 CGPA. Strong fundamentals in combinational/sequential logic, setup & hold times, and HDL syntax.",
        "selection_process": "Round 1: AI Resume Evaluation → Round 2: AI Digital Electronics & Verilog Interview → Round 3: HDL Testbench Coding Challenge → Round 4: Technical & HR",
        "responsibilities": "Write synthesizable Verilog modules and self-checking testbenches. Run gate-level simulations and analyze functional code coverage reports under Principal Chip Architects."
    },

    # 9. Chemical Engineering - Experienced
    {
        "name": "Dr. Shalini Ramanathan",
        "email": "shalini.chem@aihire.com",
        "branch": "Chemical Engineering",
        "field": "Petrochemicals, Polymers & Process Optimization",
        "job_title": "Senior Chemical Process & Plant Design Engineer",
        "department": "Petrochemical & Process Engineering",
        "description": "Design continuous chemical synthesis plants, optimize distillation columns, mass-heat transfer balances, and enforce HAZOP process safety protocols.",
        "required_skills": ["Aspen Plus / HYSYS", "Heat & Mass Transfer", "Reaction Kinetics", "P&ID / PFD", "HAZOP", "Distillation"],
        "preferred_skills": ["Fluid Dynamics", "Six Sigma Black Belt", "Polymer Chemistry", "Process Instrumentation"],
        "experience": "4-7 years",
        "experience_level": "Mid-Senior Level",
        "salary_range": "₹12.0 - ₹19.0 LPA",
        "location": "Vadodara, Gujarat / Mumbai",
        "work_mode": "On-Site (Refinery / Design Center)",
        "openings": 3,
        "employment_type": "Full-Time, Permanent",
        "education": "B.Tech / M.Tech in Chemical Engineering",
        "eligibility": "B.Tech in Chemical Engineering with 4+ years of industrial simulation using Aspen Plus/HYSYS and preparing Process Flow Diagrams (PFD) and Piping & Instrumentation Diagrams (P&ID).",
        "selection_process": "Round 1: AI Screening → Round 2: AI Chemical Process Interview → Round 3: Aspen Simulation Problem Solving → Round 4: Plant Leadership Discussion",
        "responsibilities": "Model equilibrium stage separations, size control valves and heat exchangers, lead Hazard and Operability (HAZOP) audits, and optimize energy consumption."
    },

    # 10. Chemical Engineering - FRESHER ROLE
    {
        "name": "Er. Gaurav Chhabra",
        "email": "gaurav.getchem@aihire.com",
        "branch": "Chemical Engineering",
        "field": "Process Safety & Quality Assurance",
        "job_title": "Graduate Chemical Engineer Trainee - Plant Operations (Fresher)",
        "department": "Specialty Chemicals & Manufacturing",
        "description": "Launch your career in specialty chemicals and pharmaceuticals. Gain direct experience in reactor yield optimization, batch process controls, and environmental discharge testing.",
        "required_skills": ["Chemical Reaction Engineering", "Mass Transfer Operations", "Stoichiometry", "Fluid Mechanics", "Industrial Chemistry"],
        "preferred_skills": ["Aspen Basics", "MS Excel Data Logging", "OSHA Safety Guidelines"],
        "experience": "Fresher (0-1 years)",
        "experience_level": "Fresher",
        "salary_range": "₹4.5 - ₹6.5 LPA",
        "location": "Dahej, Gujarat / Visakhapatnam, AP",
        "work_mode": "On-Site",
        "openings": 7,
        "employment_type": "Full-Time Trainee",
        "education": "B.Tech / B.E. in Chemical Engineering (2024-2026 Batch)",
        "eligibility": "Graduating in 2024, 2025, or 2026 with B.Tech in Chemical Engineering. Minimum 60% marks without current backlogs.",
        "selection_process": "Round 1: AI Resume Match → Round 2: AI Core Chemical Engineering Interview → Round 3: Technical Operations Viva → Round 4: HR Final",
        "responsibilities": "Monitor continuous reactor parameters (temperature, pressure, pH), record batch logs, analyze raw material purity, and ensure zero-leak safety procedures."
    },

    # 11. Automobile & EV Engineering - Experienced
    {
        "name": "Er. Tanmay Deshpande",
        "email": "tanmay.ev@aihire.com",
        "branch": "Automobile Engineering",
        "field": "Electric Vehicles & Battery Management Systems (BMS)",
        "job_title": "Senior EV Powertrain & Battery Systems Engineer",
        "department": "Electric Mobility & Battery Tech",
        "description": "Design lithium-ion battery packs, thermal runaway mitigation strategies, state-of-charge (SoC) estimation algorithms, and regenerative braking motor controllers.",
        "required_skills": ["MATLAB/Simulink", "Battery Management Systems (BMS)", "CAN Bus", "Thermal Management", "EV Powertrain", "High Voltage Safety"],
        "preferred_skills": ["AutoSAR", "Ansys Fluent for Battery CFD", "ISO 26262 Functional Safety", "Motor Control FOC"],
        "experience": "3-6 years",
        "experience_level": "Mid-Senior Level",
        "salary_range": "₹13.0 - ₹20.0 LPA",
        "location": "Pune / Bengaluru",
        "work_mode": "Hybrid (R&D Center)",
        "openings": 5,
        "employment_type": "Full-Time, Permanent",
        "education": "B.Tech / M.Tech in Automobile / Electrical / Mechatronics Engineering",
        "eligibility": "Demonstrated engineering experience in electric vehicle powertrain, BMS architecture, or high-voltage battery enclosures.",
        "selection_process": "Round 1: AI Resume Screening → Round 2: AI EV & Powertrain Technical Interview → Round 3: Battery Thermal Model Assessment → Round 4: Leadership Interview",
        "responsibilities": "Develop model-based algorithms for state-of-charge and state-of-health battery calculations. Validate CAN communication protocols and conduct thermal chamber cycle tests."
    },

    # 12. Automobile & EV Engineering - FRESHER ROLE
    {
        "name": "Er. Simran Preet",
        "email": "simran.getauto@aihire.com",
        "branch": "Automobile Engineering",
        "field": "Vehicle Testing & Chassis Trainee",
        "job_title": "Graduate Automotive Engineer Trainee - EV Systems (Fresher)",
        "department": "Vehicle Dynamics & EV Integration",
        "description": "Entry-level pathway into the booming Indian EV revolution. Work on electric scooter/car chassis dynamics, suspension tuning, brake test metrics, and telemetry data collection.",
        "required_skills": ["Automobile Systems", "Internal Combustion & EV Basics", "Strength of Materials", "CAD Basics", "Mechanical Measurements"],
        "preferred_skills": ["MATLAB Basics", "SolidWorks", "Electric Motors Basics", "Hands-on Workshop Experience"],
        "experience": "Fresher (0-1 years)",
        "experience_level": "Fresher",
        "salary_range": "₹4.8 - ₹6.8 LPA",
        "location": "Pune / Chennai / Manesar",
        "work_mode": "On-Site (Testing Track & Workshop)",
        "openings": 10,
        "employment_type": "Full-Time Trainee",
        "education": "B.Tech / B.E. in Automobile / Mechanical / Mechatronics Engineering (2024-2026 Batch)",
        "eligibility": "2024-2026 passout. Minimum 60% or 6.5 CGPA. Passion for vehicle dynamics, EV architecture, and telemetry analysis.",
        "selection_process": "Round 1: AI Resume Matching → Round 2: AI Automobile & EV Engineering Interview → Round 3: Mechanical & Workshop Aptitude → Round 4: HR Onboarding",
        "responsibilities": "Instrument test prototype vehicles with thermocouples and accelerometers. Log chassis vibration and range efficiency data under real-world track conditions."
    },

    # 13. Aerospace & Avionics Engineering
    {
        "name": "Tarun Chawla",
        "email": "tarun.avionics@aihire.com",
        "branch": "Aerospace Engineering",
        "field": "Aerospace Flight Software & Avionics",
        "job_title": "Safety-Critical Flight Software Engineer (DO-178C)",
        "department": "Avionics & Space Guidance Systems",
        "description": "Write deterministic, fault-tolerant flight control and telemetry software adhering strictly to DO-178C Level A aviation and satellite launch standards.",
        "required_skills": ["C", "C++", "Embedded Systems", "RTOS", "Control Systems", "Flight Dynamics"],
        "preferred_skills": ["DO-178C", "Hardware-in-the-Loop", "CAN Bus / MIL-STD-1553", "Fault Tolerance", "Matlab Simulink"],
        "experience": "4-8 years",
        "experience_level": "Senior Lead",
        "salary_range": "₹16.0 - ₹25.0 LPA",
        "location": "Bengaluru / Hyderabad (Aerospace SEZ)",
        "work_mode": "On-Site (Defense & Aerospace Facility)",
        "openings": 3,
        "employment_type": "Full-Time, Permanent",
        "education": "B.Tech / M.Tech in Aerospace / Avionics / Computer Engineering",
        "eligibility": "B.Tech in Aerospace/Avionics with 4+ years in safety-critical firmware or flight guidance algorithms.",
        "selection_process": "Round 1: AI Resume Audit → Round 2: AI Flight Software & Control Interview → Round 3: Real-Time Deterministic Coding Test → Round 4: Security & Technical Panel",
        "responsibilities": "Design deterministic guidance software, execute rigorous hardware-in-the-loop simulations, and verify fail-safe redundancies for altitude and trajectory correction."
    },

    # 14. Biomedical Engineering
    {
        "name": "Dr. Sunita Rao",
        "email": "sunita.healthtech@aihire.com",
        "branch": "Biomedical Engineering",
        "field": "Medical Devices & Diagnostic Instrumentation",
        "job_title": "Biomedical Instrumentation & Medical Device Engineer",
        "department": "Clinical Devices & Healthcare Hardware",
        "description": "Engineer life-saving patient monitoring devices, biosensor amplifiers, medical ultrasound electronics, and ensure ISO 13485 medical regulatory compliance.",
        "required_skills": ["Biomedical Sensors", "Analog Electronics", "Signal Processing", "ISO 13485", "Python", "Microcontrollers"],
        "preferred_skills": ["ECG/EEG Filtering", "MATLAB", "Medical Robotics", "FDA 510(k) Guidelines"],
        "experience": "2-5 years",
        "experience_level": "Mid-Level",
        "salary_range": "₹8.5 - ₹14.0 LPA",
        "location": "Bengaluru / Hyderabad",
        "work_mode": "Hybrid",
        "openings": 4,
        "employment_type": "Full-Time, Permanent",
        "education": "B.Tech / M.Tech in Biomedical / Medical Electronics Engineering",
        "eligibility": "Degree in Biomedical Engineering with hands-on expertise in analog front-end filters for biological signals and IEC 60601 electrical safety testing.",
        "selection_process": "Round 1: AI Resume Matching → Round 2: AI Biomedical Engineering & Sensor Interview → Round 3: Medical Circuit Design Challenge → Round 4: Management Discussion",
        "responsibilities": "Design low-noise operational amplifier stages for human biopotentials. Validate firmware for real-time SpO2 and non-invasive blood pressure monitors."
    },

    # 15. Environmental & Sustainable Engineering
    {
        "name": "Er. Radhika Merchant",
        "email": "radhika.enviro@aihire.com",
        "branch": "Environmental Engineering",
        "field": "Industrial Effluent & Carbon Emission Auditing",
        "job_title": "Environmental Compliance & Sustainable Tech Specialist",
        "department": "Sustainability & CleanTech",
        "description": "Formulate industrial zero-liquid discharge (ZLD) treatment designs, carbon footprint accounting models, air emission scrubber specs, and CPCB regulatory compliance.",
        "required_skills": ["Wastewater Treatment", "Air Pollution Control", "CPCB Regulations", "Environmental Impact Assessment (EIA)", "Chemistry", "MS Excel"],
        "preferred_skills": ["Carbon Accounting", "ISO 14001", "GIS Mapping", "Zero Liquid Discharge"],
        "experience": "3-6 years",
        "experience_level": "Mid-Level",
        "salary_range": "₹7.5 - ₹12.5 LPA",
        "location": "Gurugram / Mumbai / Kolkata",
        "work_mode": "Hybrid",
        "openings": 3,
        "employment_type": "Full-Time, Permanent",
        "education": "B.Tech / M.Tech in Environmental / Chemical / Civil Engineering",
        "eligibility": "Degree in Environmental or Chemical Engineering with knowledge of statutory CPCB / SPCB pollution norms and wastewater treatment plant sizing.",
        "selection_process": "Round 1: AI Resume Parsing → Round 2: AI Environmental Engineering Interview → Round 3: Effluent Treatment Sizing Case Study → Round 4: HR Final",
        "responsibilities": "Calculate biological oxygen demand (BOD) and chemical oxygen demand (COD) reduction efficiencies. Conduct environmental audits across manufacturing sites."
    },

    # 16. Mechatronics & Robotics
    {
        "name": "Arjun Singhania",
        "email": "arjun.robotics@aihire.com",
        "branch": "Mechatronics & Robotics",
        "field": "Industrial Automation, PLC & Autonomous Systems",
        "job_title": "Robotics & Industrial Mechatronics Automation Specialist",
        "department": "Smart Factory & Industrial Robotics",
        "description": "Program multi-axis KUKA/ABB articulated industrial robots, configure Siemens/Rockwell PLCs, SCADA screens, and integrate machine vision barcode/inspection systems.",
        "required_skills": ["PLC Programming (Ladder)", "SCADA", "Robotics (ROS/KUKA)", "Pneumatics & Hydraulics", "Industrial Ethernet", "Python"],
        "preferred_skills": ["Computer Vision", "TwinCAT", "Servo Drives", "Safety Relays", "OPC-UA"],
        "experience": "3-6 years",
        "experience_level": "Mid-Senior Level",
        "salary_range": "₹11.0 - ₹17.5 LPA",
        "location": "Pune / Bengaluru / Gurgaon",
        "work_mode": "On-Site (Automation Lab & Client Lines)",
        "openings": 4,
        "employment_type": "Full-Time, Permanent",
        "education": "B.Tech in Mechatronics / Instrumentation / Mechanical Engineering",
        "eligibility": "B.Tech in Mechatronics or Automation with strong practical mastery of PLC programming (IEC 61131-3) and robotic coordinate kinematic frames.",
        "selection_process": "Round 1: AI Resume Match → Round 2: AI Mechatronics & Control Interview → Round 3: Ladder Logic & Motion Problem Solving → Round 4: Executive Panel",
        "responsibilities": "Develop PLC ladder logic and HMI supervisory screens. Calibrate robotic end-effector tool centers and coordinate synchronized pick-and-place lines."
    },

    # 17. Computer Science & AI
    {
        "name": "Dr. Rajesh Sharma",
        "email": "rajesh.ai@aihire.com",
        "branch": "Computer Science & Engineering",
        "field": "Generative AI, Large Language Models & Deep Learning",
        "job_title": "Principal AI & Generative Systems Architect",
        "department": "AI & Deep Learning Labs",
        "description": "Pioneer foundation model fine-tuning, retrieval-augmented generation (RAG) at scale, distributed multi-GPU training, and low-latency tensor inference engines.",
        "required_skills": ["Python", "PyTorch", "Transformers", "LLM Fine-Tuning", "Vector Databases", "Deep Learning"],
        "preferred_skills": ["CUDA", "vLLM", "Distributed Training (DeepSpeed)", "LangChain", "Ray"],
        "experience": "5-9 years",
        "experience_level": "Senior Lead",
        "salary_range": "₹24.0 - ₹38.0 LPA",
        "location": "Bengaluru / Remote",
        "work_mode": "Hybrid / Flexible Remote",
        "openings": 4,
        "employment_type": "Full-Time, Permanent",
        "education": "B.Tech / M.Tech / Ph.D. in Computer Science, AI, or Mathematics",
        "eligibility": "Advanced degree with proven portfolio of trained and deployed transformers, LLM agent architectures, and high-throughput inference optimization.",
        "selection_process": "Round 1: AI Resume Evaluation → Round 2: AI Deep Learning & Architecture Interview → Round 3: Transformer Model Coding & Optimization → Round 4: Executive Interview",
        "responsibilities": "Architect RAG data pipelines with semantic embedding models. Benchmark inference token speed, reduce hallucinations, and deploy scaled vLLM clusters."
    },

    # 18. Computer Science & Cloud DevOps
    {
        "name": "Priya Patel",
        "email": "priya.cloud@aihire.com",
        "branch": "Information Technology & Computer Science",
        "field": "Cloud Infrastructure, Kubernetes & Site Reliability",
        "job_title": "Lead Cloud Infrastructure & DevOps Architect",
        "department": "Cloud Platforms & SRE",
        "description": "Govern multi-cloud Kubernetes clusters, automate zero-downtime blue-green deployments with Terraform and Helm, and implement distributed observability stacks.",
        "required_skills": ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD (GitHub Actions)", "Linux"],
        "preferred_skills": ["GCP", "Prometheus/Grafana", "ArgoCD", "Istio Service Mesh", "Security Hardening"],
        "experience": "4-7 years",
        "experience_level": "Mid-Senior Level",
        "salary_range": "₹16.0 - ₹26.0 LPA",
        "location": "Bengaluru / Hyderabad / Remote",
        "work_mode": "Hybrid / Remote",
        "openings": 6,
        "employment_type": "Full-Time, Permanent",
        "education": "B.Tech / B.E. in Computer Science / IT / Electronics",
        "eligibility": "B.Tech with CKA (Certified Kubernetes Administrator) or AWS Solutions Architect credentials preferred. Hands-on mastery of IaC and high-availability systems.",
        "selection_process": "Round 1: AI Resume Matching → Round 2: AI Cloud & DevOps Technical Interview → Round 3: Live Infrastructure-as-Code Scenario → Round 4: Culture & Leadership",
        "responsibilities": "Write declarative Terraform configurations for microservices. Build resilient Kubernetes pods, auto-scaling horizontal policies, and monitor SLO/SLI metrics."
    },

    # 19. Computer Science & Cybersecurity
    {
        "name": "Amit Verma",
        "email": "amit.cyber@aihire.com",
        "branch": "Computer Science & Cyber Defense",
        "field": "Offensive Security, Threat Hunting & SOC Defense",
        "job_title": "Senior Cybersecurity Threat Hunter & Ethical Hacker",
        "department": "Enterprise Security & Cyber Intelligence",
        "description": "Uncover zero-day vulnerabilities through red teaming, audit cloud IAM policies, dissect malware binaries, and defend enterprise infrastructure from advanced persistent threats.",
        "required_skills": ["Penetration Testing", "Network Security", "Python", "Linux", "OWASP Top 10", "Wireshark"],
        "preferred_skills": ["OSCP Certification", "Burp Suite Pro", "SIEM (Splunk)", "Reverse Engineering", "Cloud Security"],
        "experience": "3-6 years",
        "experience_level": "Mid-Senior Level",
        "salary_range": "₹13.0 - ₹21.0 LPA",
        "location": "Bengaluru / Delhi NCR / Remote",
        "work_mode": "Hybrid",
        "openings": 4,
        "employment_type": "Full-Time, Permanent",
        "education": "B.Tech / B.E. in Computer Science / Information Security",
        "eligibility": "Proven track record in application security, network penetration testing, and ethical hacking. OSCP or CEH certification is a strong advantage.",
        "selection_process": "Round 1: AI Automated Resume Audit → Round 2: AI Cybersecurity & Protocol Interview → Round 3: Hands-on Vulnerability Exploit Lab → Round 4: Leadership Fit",
        "responsibilities": "Execute regular penetration tests across REST APIs and web applications. Conduct root-cause forensics on security telemetry alerts and harden production servers."
    },

    # 20. Computer Science & Software - FRESHER ROLE
    {
        "name": "Sneha Reddy",
        "email": "sneha.fullstack@aihire.com",
        "branch": "Computer Science & Engineering",
        "field": "Full Stack Web & Modern App Development",
        "job_title": "Graduate Software Engineer Trainee - Full Stack (Fresher)",
        "department": "Digital Platforms & Product Engineering",
        "description": "Elite campus fresher role for 2024-2026 CS/IT graduates. Build scalable modern web applications with React, TypeScript, FastAPI/Python, and cloud database engines.",
        "required_skills": ["JavaScript/TypeScript", "Python or Java", "React Basics", "HTML5 & CSS3", "Data Structures & Algorithms", "SQL"],
        "preferred_skills": ["FastAPI / Node.js", "Git / GitHub", "Tailwind CSS", "Docker Basics", "REST API Development"],
        "experience": "Fresher (0-1 years)",
        "experience_level": "Fresher",
        "salary_range": "₹5.5 - ₹8.5 LPA + Joining Bonus",
        "location": "Bengaluru / Hyderabad / Pune",
        "work_mode": "Hybrid (3 Days Office / 2 Days Remote)",
        "openings": 20,
        "employment_type": "Full-Time Trainee",
        "education": "B.Tech / B.E. / MCA in Computer Science / IT / Software Engineering (2024-2026 Batch)",
        "eligibility": "Graduation batch 2024, 2025, or 2026. Minimum 60% or 6.5 CGPA with no current backlogs. Solid algorithmic problem solving and passion for building user-friendly web interfaces.",
        "selection_process": "Round 1: AI Resume Matching & Project Review → Round 2: AI Core CS & Coding Interview (DSA, OOPs, Web Concepts) → Round 3: Live Pair Programming & Problem Solving → Round 4: HR Onboarding",
        "responsibilities": "Develop modular React components and implement clean backend REST endpoints. Write unit test cases, participate in GitHub pull request reviews, and optimize page load speeds."
    }
]

def seed_database(db: Session, force: bool = False):
    # Check if database has already been seeded with the 20 recruiters
    existing_count = db.query(User).filter(User.role == "recruiter").count()
    if existing_count >= 20 and not force:
        return

    print("Seeding AIHire with 20 Recruiters across diverse branches & fields (0 candidate accounts)...")

    # Clear existing users, jobs, candidates, interviews, reports to guarantee clean state
    db.query(EvaluationReport).delete()
    db.query(CandidateResponse).delete()
    db.query(Question).delete()
    db.query(Interview).delete()
    db.query(Job).delete()
    db.query(Candidate).delete()
    db.query(User).delete()
    db.commit()

    # Compute bcrypt hash once to avoid blocking CPU / timing out on startup
    default_pwd_hash = hash_password("password123")

    # Seed 20 Recruiters and their respective Open Positions
    for r_info in RECRUITER_DATA:
        recruiter = User(
            name=r_info["name"],
            email=r_info["email"],
            password_hash=default_pwd_hash,
            role="recruiter"
        )
        db.add(recruiter)
        db.commit()
        db.refresh(recruiter)

        # Create job requisition for this recruiter
        job = Job(
            recruiter_id=recruiter.id,
            title=r_info["job_title"],
            department=f"{r_info['department']} ({r_info['field']})",
            description=r_info["description"],
            required_skills=json.dumps(r_info["required_skills"]),
            preferred_skills=json.dumps(r_info.get("preferred_skills", [])),
            experience=r_info["experience"],
            education=r_info.get("education", f"B.Tech in {r_info['branch']} or related specialization"),
            responsibilities=r_info.get("responsibilities", ""),
            location=r_info.get("location", "Bengaluru / Hybrid"),
            work_mode=r_info.get("work_mode", "Hybrid"),
            salary_range=r_info.get("salary_range", "Competitive CTC"),
            openings=r_info.get("openings", 3),
            employment_type=r_info.get("employment_type", "Full-Time"),
            experience_level=r_info.get("experience_level", "Fresher"),
            eligibility=r_info.get("eligibility", ""),
            selection_process=r_info.get("selection_process", ""),
            scoring_weights=json.dumps({
                "technical": 0.40,
                "problem_solving": 0.20,
                "communication": 0.15,
                "role_relevance": 0.15,
                "behavioral": 0.10
            }),
            is_active=True
        )
        db.add(job)
        db.commit()

    print(f"Successfully seeded {len(RECRUITER_DATA)} Recruiters across 20 distinct engineering branches with 0 candidate accounts.")
