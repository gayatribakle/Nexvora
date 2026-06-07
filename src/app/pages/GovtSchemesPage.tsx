import { Gift, Download, ExternalLink, Users, IndianRupee, FileText, Share2, Bell } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

interface Scheme {
  id: string;
  name: string;
  description: string;
  ministry: string;
  eligibility: string[];
  benefits: string[];
  documents: string[];
  applicationLink: string;
  category: "financial" | "health" | "housing" | "skill";
  status: "active" | "new";
}

const schemes: Scheme[] = [
  {
    id: "1",
    name: "Pradhan Mantri Shram Yogi Maan-Dhan (PM-SYM)",
    description: "Pension scheme for unorganized workers providing monthly pension after 60 years",
    ministry: "Ministry of Labour and Employment",
    eligibility: [
      "Age between 18-40 years",
      "Monthly income less than ₹15,000",
      "Not covered under any statutory social security scheme",
      "Must have a savings bank account and Aadhaar"
    ],
    benefits: [
      "Monthly pension of ₹3,000 after 60 years",
      "Family pension in case of death during pension period",
      "Contribution matched by Central Government"
    ],
    documents: [
      "Aadhaar Card",
      "Savings Bank Account/Jan-Dhan Account",
      "Age proof document",
      "Income certificate"
    ],
    applicationLink: "https://maandhan.in/shramyogi",
    category: "financial",
    status: "active"
  },
  {
    id: "2",
    name: "Atal Pension Yojana (APY)",
    description: "Government backed pension scheme for all citizens of India",
    ministry: "Ministry of Finance",
    eligibility: [
      "Age between 18-40 years",
      "Indian citizen",
      "Must have a savings bank account",
      "Valid mobile number and Aadhaar"
    ],
    benefits: [
      "Guaranteed pension between ₹1,000 to ₹5,000 per month",
      "Government co-contribution for eligible subscribers",
      "Spouse continuation in case of death"
    ],
    documents: [
      "Aadhaar Card",
      "Bank Account Details",
      "Mobile Number",
      "Nomination Form"
    ],
    applicationLink: "https://npscra.nsdl.co.in/scheme-details.php",
    category: "financial",
    status: "active"
  },
  {
    id: "3",
    name: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)",
    description: "Health insurance scheme providing coverage up to ₹5 lakhs per family per year",
    ministry: "Ministry of Health and Family Welfare",
    eligibility: [
      "Families identified under SECC 2011 database",
      "Workers from unorganized sector",
      "No limit on family size, age, or gender",
      "Pre-existing diseases covered from day one"
    ],
    benefits: [
      "Coverage up to ₹5 lakh per family per year",
      "Cashless treatment at empaneled hospitals",
      "1,393 procedures covered",
      "Pre and post-hospitalization expenses covered"
    ],
    documents: [
      "Aadhaar Card",
      "Ration Card",
      "SECC 2011 verification",
      "Mobile number for e-card"
    ],
    applicationLink: "https://pmjay.gov.in/",
    category: "health",
    status: "active"
  },
  {
    id: "4",
    name: "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)",
    description: "Housing scheme providing assistance for construction of pucca house",
    ministry: "Ministry of Rural Development",
    eligibility: [
      "Households without pucca house",
      "Economically Weaker Section (EWS) families",
      "SC/ST/Minorities/OBC categories",
      "Annual income criteria as per guidelines"
    ],
    benefits: [
      "Financial assistance of ₹1.20 lakh (Plain areas)",
      "₹1.30 lakh for hilly states/difficult areas",
      "Convergence with other schemes",
      "Interest subsidy on home loans"
    ],
    documents: [
      "Aadhaar Card",
      "Income Certificate",
      "Caste Certificate (if applicable)",
      "Bank Account Details",
      "Land ownership documents"
    ],
    applicationLink: "https://pmayg.nic.in/",
    category: "housing",
    status: "active"
  },
  {
    id: "5",
    name: "Pradhan Mantri Kaushal Vikas Yojana (PMKVY)",
    description: "Skill development initiative enabling youth to take up industry-relevant training",
    ministry: "Ministry of Skill Development and Entrepreneurship",
    eligibility: [
      "Indian citizen",
      "School/college dropouts",
      "Unemployed youth",
      "Age between 15-45 years (flexible)"
    ],
    benefits: [
      "Free skill training in various sectors",
      "Monetary reward on successful completion",
      "Government certification (NSQF aligned)",
      "Placement assistance"
    ],
    documents: [
      "Aadhaar Card",
      "Age proof document",
      "Educational certificates",
      "Bank Account Details",
      "Passport size photographs"
    ],
    applicationLink: "https://www.pmkvyofficial.org/",
    category: "skill",
    status: "active"
  },
  {
    id: "6",
    name: "Building and Other Construction Workers (BOCW) Welfare Scheme",
    description: "Comprehensive welfare scheme for construction workers and their families",
    ministry: "Ministry of Labour and Employment",
    eligibility: [
      "Engaged in building or construction work",
      "Age between 18-60 years",
      "Worked for at least 90 days in preceding 12 months",
      "Registered with State Labour Welfare Board"
    ],
    benefits: [
      "Financial assistance for education of children",
      "Medical treatment and maternity benefits",
      "Pension and disability benefits",
      "Financial assistance for marriage",
      "Death and accident benefits"
    ],
    documents: [
      "Aadhaar Card",
      "Work certificate from employer/contractor",
      "Passport size photographs",
      "Bank Account Details",
      "Proof of 90 days work"
    ],
    applicationLink: "https://labour.gov.in/",
    category: "financial",
    status: "new"
  }
];

export function GovtSchemesPage() {
  const getCategoryBadge = (category: Scheme["category"]) => {
    const config = {
      financial: { bg: "bg-[#059669]", text: "Financial Aid" },
      health: { bg: "bg-[#DC2626]", text: "Healthcare" },
      housing: { bg: "bg-[#0891B2]", text: "Housing" },
      skill: { bg: "bg-[#D97706]", text: "Skill Development" }
    };
    return config[category];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Government Labour Schemes</h1>
          <p className="text-gray-500">Access and share welfare schemes with workers</p>
        </div>
        <Button className="bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#059669] text-white">
          <Share2 className="w-4 h-4 mr-2" />
          Share All Schemes
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 shadow-lg border-l-4 border-[#0891B2]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#0891B2]/10 flex items-center justify-center">
              <Gift className="w-6 h-6 text-[#0891B2]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Available Schemes</p>
              <p className="text-2xl font-bold text-gray-900">6</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#059669]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#059669]/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#059669]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Eligible Workers</p>
              <p className="text-2xl font-bold text-gray-900">1,089</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#D97706]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#D97706]/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#D97706]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Applications Sent</p>
              <p className="text-2xl font-bold text-gray-900">342</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-lg border-l-4 border-[#DC2626]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#DC2626]/10 flex items-center justify-center">
              <Bell className="w-6 h-6 text-[#DC2626]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">New Schemes</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Schemes Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Schemes</TabsTrigger>
          <TabsTrigger value="financial">Financial Aid</TabsTrigger>
          <TabsTrigger value="health">Healthcare</TabsTrigger>
          <TabsTrigger value="housing">Housing</TabsTrigger>
          <TabsTrigger value="skill">Skill Development</TabsTrigger>
        </TabsList>

        {["all", "financial", "health", "housing", "skill"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {schemes
              .filter((scheme) => tab === "all" || scheme.category === tab)
              .map((scheme) => {
                const categoryConfig = getCategoryBadge(scheme.category);
                return (
                  <Card key={scheme.id} className="p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{scheme.name}</h3>
                          {scheme.status === "new" && (
                            <Badge className="bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={`${categoryConfig.bg} text-white`}>
                            {categoryConfig.text}
                          </Badge>
                          <span className="text-sm text-gray-500">{scheme.ministry}</span>
                        </div>
                        <p className="text-gray-600 mb-4">{scheme.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Eligibility */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#0891B2]" />
                          Eligibility Criteria
                        </h4>
                        <ul className="space-y-1">
                          {scheme.eligibility.map((item, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-[#059669] mt-1">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Benefits */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-[#059669]" />
                          Key Benefits
                        </h4>
                        <ul className="space-y-1">
                          {scheme.benefits.map((item, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-[#059669] mt-1">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Required Documents */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#D97706]" />
                        Required Documents
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {scheme.documents.map((doc, index) => (
                          <Badge key={index} variant="outline" className="font-normal">
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        className="bg-gradient-to-r from-[#0891B2] to-[#06B6D4] hover:from-[#0e7490] hover:to-[#0891B2] text-white"
                        onClick={() => window.open(scheme.applicationLink, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Apply Online
                      </Button>
                      <Button variant="outline" className="hover:bg-[#059669]/10 hover:border-[#059669] hover:text-[#059669]">
                        <Download className="w-4 h-4 mr-2" />
                        Download Details
                      </Button>
                      <Button variant="outline" className="hover:bg-[#D97706]/10 hover:border-[#D97706] hover:text-[#D97706]">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share with Workers
                      </Button>
                    </div>
                  </Card>
                );
              })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
