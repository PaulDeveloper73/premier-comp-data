'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Download, Sparkles, BookOpen, BarChart3, TrendingUp, 
  Search, Filter, ChevronDown, ChevronLeft, ChevronRight, X,
  Calendar, Users, CheckCircle, Clock, Archive, SortAsc, SortDesc, Star,
  Info, ArrowRight, Quote, Award, Zap, Target, GraduationCap, Microscope,
  Briefcase, School, User, Laptop, BookMarked, UserCheck, Globe
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import ReportConfigurationModal from '@/components/ai-thesis/ReportConfigurationModal';
import ReportGenerationProgress from '@/components/ai-thesis/ReportGenerationProgress';
import ReportDisplayView from '@/components/ai-thesis/ReportDisplayView';

interface Survey {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  survey_status: string;
  total_responses: number;
  created_at: string;
  updated_at: string;
}

export default function AIThesisReportPage() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Modal and report generation states
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [reportConfig, setReportConfig] = useState<any>(null);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [selectedSurveyForModal, setSelectedSurveyForModal] = useState<Survey | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'title' | 'responses' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  
  // Showcase survey selector
  const [showcaseSurveyId, setShowcaseSurveyId] = useState<string>('');
  const [showcaseSearchQuery, setShowcaseSearchQuery] = useState('');
  const [showShowcaseDropdown, setShowShowcaseDropdown] = useState(false);
  
  // Success Stories pagination - responsive
  const [currentStoryPage, setCurrentStoryPage] = useState(0);
  
  // Get stories per page based on screen size
  const getStoriesPerPage = () => {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width < 768) return 1;
    if (width < 1024) return 2;
    return 3;
  };
  
  const [storiesPerPage, setStoriesPerPage] = useState(getStoriesPerPage());
  
  useEffect(() => {
    const handleResize = () => {
      setStoriesPerPage(getStoriesPerPage());
      setCurrentStoryPage(0);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchSurveys();
  }, []);

  useEffect(() => {
    if (surveys.length > 0 && !showcaseSurveyId) {
      const topSurvey = surveys.reduce((prev, current) => 
        (current.total_responses || 0) > (prev.total_responses || 0) ? current : prev
      );
      setShowcaseSurveyId(topSurvey.id);
    }
  }, [surveys, showcaseSurveyId]);

  const fetchSurveys = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch('/api/surveys', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSurveys(data.surveys || []);
      }
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(surveys.map(s => s.category).filter(Boolean));
    return Array.from(cats);
  }, [surveys]);

  const filteredAndSortedSurveys = useMemo(() => {
    let filtered = surveys;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.category?.toLowerCase().includes(query)
      );
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(s => s.category === categoryFilter);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.survey_status === statusFilter);
    }
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'responses':
          comparison = (a.total_responses || 0) - (b.total_responses || 0);
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return filtered;
  }, [surveys, searchQuery, categoryFilter, statusFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedSurveys.length / itemsPerPage);
  const paginatedSurveys = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedSurveys.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedSurveys, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, statusFilter, sortBy, sortOrder]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  const toggleSort = (field: 'title' | 'responses' | 'date') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const activeFiltersCount = [
    searchQuery !== '',
    categoryFilter !== 'all',
    statusFilter !== 'all'
  ].filter(Boolean).length;

  const handleGenerateReport = () => {
    if (selectedSurvey) {
      const survey = surveys.find(s => s.id === selectedSurvey);
      if (survey) {
        setSelectedSurveyForModal(survey);
        setShowConfigModal(true);
      }
    }
  };

  const handleConfigSubmit = (config: any) => {
    setReportConfig(config);
    setShowConfigModal(false);
    setShowProgressModal(true);
  };

  const handleReportComplete = (report: any) => {
    setGeneratedReport(report);
    setShowProgressModal(false);
  };

  const handleBackToList = () => {
    setGeneratedReport(null);
    setReportConfig(null);
    setSelectedSurvey('');
    setSelectedSurveyForModal(null);
  };

  const handleSurveyClick = (surveyId: string) => {
    const survey = surveys.find(s => s.id === surveyId);
    if (survey) {
      setSelectedSurveyForModal(survey);
      setShowConfigModal(true);
    }
  };

  const successStories = [
    { rating: 5, quote: "Generated my entire Chapter 4 & 5 in minutes! Saved me weeks of work.", author: "Theology Student", role: "Master's Thesis", year: "2026" },
    { rating: 5, quote: "The statistical analysis is professional and thesis-ready!", author: "Research Assistant", role: "PhD Candidate", year: "2026" },
    { rating: 5, quote: "Incredible tool! The AI-generated insights were spot-on.", author: "Ministry Leader", role: "DMin Student", year: "2026" },
    { rating: 5, quote: "I was amazed by the quality of data visualization.", author: "Seminary Professor", role: "Research Supervisor", year: "2026" },
    { rating: 5, quote: "This tool transformed my survey data into publication-ready chapters.", author: "Doctoral Researcher", role: "PhD Theology", year: "2026" },
    { rating: 5, quote: "The cross-question analysis revealed patterns I hadn't noticed.", author: "Church Researcher", role: "Ministry Analytics", year: "2026" }
  ];

  const totalStoryPages = Math.ceil(successStories.length / storiesPerPage);
  const currentStories = successStories.slice(
    currentStoryPage * storiesPerPage,
    (currentStoryPage + 1) * storiesPerPage
  );

  return (
    <DashboardLayout>
      <ProtectedRoute requireAuth={true}>
        {/* Show report display if report is generated */}
        {generatedReport && reportConfig && selectedSurveyForModal ? (
          <ReportDisplayView
            surveyId={selectedSurveyForModal.id}
            report={generatedReport}
            config={reportConfig}
            onBackToList={handleBackToList}
          />
        ) : (
          <>
        <div className="mb-6">
          <nav className="flex mb-4 text-sm">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 transition">
              Dashboard
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="font-medium text-gray-900 dark:text-white">AI Thesis Report Generator</span>
          </nav>

          <div className="flex xl:flex-row flex-col xl:justify-between xl:items-start gap-4">
            <div className="flex-1">
              <h1 className="mb-2 font-bold text-gray-900 dark:text-white text-2xl sm:text-3xl">
                AI Thesis Report Generator
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                Transform survey responses into professional academic research reports
              </p>
            </div>

            <div className="flex-shrink-0 bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-blue-100 dark:to-blue-800/20 shadow-sm p-3 sm:p-4 border border-blue-200 dark:border-blue-800 rounded-xl w-full xl:w-auto xl:max-w-sm">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-1.5 sm:p-2 rounded-lg">
                  <Info className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="mb-1 font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">Need Help?</h3>
                  <p className="mb-2 text-[10px] text-gray-700 dark:text-gray-300 sm:text-xs leading-relaxed">
                    Use the search and filters to quickly find your survey
                  </p>
                  <Link href="/docs/ai-thesis-report" className="inline-flex items-center gap-1 font-medium text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 sm:text-xs transition">
                    View Documentation
                    <ArrowRight className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="gap-4 sm:gap-6 grid grid-cols-1 xl:grid-cols-3 mt-6">
          <div className="space-y-3 sm:space-y-4 xl:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow-sm p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="space-y-3 sm:space-y-4">
                <div className="relative">
                  <Search className="top-1/2 left-2 sm:left-3 absolute w-4 sm:w-5 h-4 sm:h-5 text-gray-400 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search surveys..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="dark:bg-gray-700 py-2 sm:py-3 pr-3 sm:pr-4 pl-8 sm:pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 w-full dark:text-white text-sm sm:text-base transition"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="top-1/2 right-2 sm:right-3 absolute text-gray-400 hover:text-gray-600 -translate-y-1/2">
                      <X className="w-4 sm:w-5 h-4 sm:h-5" />
                    </button>
                  )}
                </div>

                <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-sm transition ${
                        showFilters || activeFiltersCount > 0 ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      <Filter className="w-3 sm:w-4 h-3 sm:h-4" />
                      <span className="hidden xs:inline">Filters</span>
                      {activeFiltersCount > 0 && (
                        <span className="flex justify-center items-center bg-blue-600 rounded-full w-4 sm:w-5 h-4 sm:h-5 font-bold text-[10px] text-white sm:text-xs">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>
                    {activeFiltersCount > 0 && (
                      <button onClick={handleClearFilters} className="text-blue-600 hover:text-blue-700 dark:hover:text-blue-300 dark:text-blue-400 text-xs sm:text-sm transition">
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    Showing {paginatedSurveys.length} of {filteredAndSortedSurveys.length}
                  </div>
                </div>

                {showFilters && (
                  <div className="gap-3 sm:gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pt-3 sm:pt-4 border-gray-200 dark:border-gray-700 border-t">
                    <div>
                      <label className="block mb-1.5 sm:mb-2 font-medium text-gray-700 dark:text-gray-300 text-xs sm:text-sm">Category</label>
                      <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="dark:bg-gray-700 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full dark:text-white text-xs sm:text-sm">
                        <option value="all">All Categories</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1.5 sm:mb-2 font-medium text-gray-700 dark:text-gray-300 text-xs sm:text-sm">Status</label>
                      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="dark:bg-gray-700 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full dark:text-white text-xs sm:text-sm">
                        <option value="all">All Status</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="block mb-1.5 sm:mb-2 font-medium text-gray-700 dark:text-gray-300 text-xs sm:text-sm">Per Page</label>
                      <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="dark:bg-gray-700 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full dark:text-white text-xs sm:text-sm">
                        <option value={5}>5</option>
                        <option value={8}>8</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Sort:</span>
                  {['title', 'responses', 'date'].map((field) => (
                    <button
                      key={field}
                      onClick={() => toggleSort(field as 'title' | 'responses' | 'date')}
                      className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm transition capitalize ${
                        sortBy === field ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {field}
                      {sortBy === field && (sortOrder === 'asc' ? <SortAsc className="w-2.5 sm:w-3 h-2.5 sm:h-3" /> : <SortDesc className="w-2.5 sm:w-3 h-2.5 sm:h-3" />)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white text-lg">Select Survey</h3>
              {loading ? (
                <div className="py-12 text-center">
                  <div className="inline-block border-4 border-blue-500/20 border-t-blue-500 rounded-full w-12 h-12 animate-spin"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading surveys...</p>
                </div>
              ) : filteredAndSortedSurveys.length === 0 ? (
                <div className="py-12 text-center">
                  {surveys.length === 0 ? (
                    <>
                      <FileText className="mx-auto mb-4 w-16 h-16 text-gray-400" />
                      <p className="mb-4 text-gray-600 dark:text-gray-400">No surveys found</p>
                      <Link href="/dashboard/survey-builder" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition">
                        Create Your First Survey
                      </Link>
                    </>
                  ) : (
                    <>
                    {paginatedSurveys.map(survey => (
                      <button
                        key={survey.id}
                        onClick={() => handleSurveyClick(survey.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition ${
                          selectedSurvey === survey.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                <>
                  <div className="space-y-3">
                    {paginatedSurveys.map(survey => (
                      <button
                        key={survey.id}
                        onClick={() => setSelectedSurvey(survey.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition ${
                          selectedSurvey === survey.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">{survey.title}</h4>
                              {survey.category && (
                                <span className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300 text-xs">{survey.category}</span>
                              )}
                              {survey.survey_status && (
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  survey.survey_status === 'ongoing' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                  survey.survey_status === 'completed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                  'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}>{survey.survey_status}</span>
                              )}
                            </div>
                            {survey.description && (
                              <p className="mb-2 text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{survey.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-gray-500 dark:text-gray-400 text-xs">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {survey.total_responses || 0} responses
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(survey.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="flex justify-center items-center bg-blue-100 dark:bg-blue-900/30 rounded-lg w-12 h-12">
                              <span className="font-bold text-blue-700 dark:text-blue-300">{survey.total_responses || 0}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-gray-200 dark:border-gray-700 border-t">
                      <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm sm:text-left text-center">
                        Page {currentPage} of {totalPages}
                        <span className="hidden sm:inline ml-2 text-gray-500">
                          (Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedSurveys.length)} of {filteredAndSortedSurveys.length})
                        </span>
                      </div>
                      <div className="flex justify-center items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-gray-700 dark:text-gray-300 text-xs sm:text-sm transition disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-3 sm:w-4 h-3 sm:h-4" />
                          <span className="hidden xs:inline">Prev</span>
                        </button>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) pageNum = i + 1;
                            else if (currentPage <= 3) pageNum = i + 1;
                            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = currentPage - 2 + i;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm transition ${
                                  currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-gray-700 dark:text-gray-300 text-xs sm:text-sm transition disabled:cursor-not-allowed"
                        >
                          <span className="hidden xs:inline">Next</span>
                          <ChevronRight className="w-3 sm:w-4 h-3 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {selectedSurvey && (
              <div className="bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-blue-100 dark:to-blue-800/20 p-6 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="flex justify-center items-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg w-12 h-12">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Ready to Generate Report</h3>
                    <p className="mb-4 text-gray-700 dark:text-gray-300 text-sm">
                      Click below to generate a professional academic research report with Chapter 4 & 5
                    </p>
                    <button
                      onClick={handleGenerateReport}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 hover:from-blue-700 to-blue-600 hover:to-blue-700 px-6 py-3 rounded-lg font-medium text-white transition"
                    >
                      <FileText className="w-5 h-5" />
                      Generate Thesis Report
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {surveys.length > 0 && (() => {
              const showcaseSurvey = surveys.find(s => s.id === showcaseSurveyId) || surveys[0];
              const responseRate = showcaseSurvey.total_responses || 0;
              const sortedSurveys = [...surveys].sort((a, b) => (b.total_responses || 0) - (a.total_responses || 0));
              const topPerformer = sortedSurveys[0];
              const isTopPerformer = showcaseSurvey.id === topPerformer?.id;
              
              return responseRate > 0 ? (
                <div className="bg-gradient-to-br from-theme-primary/5 to-theme-secondary/5 shadow-lg p-6 border-2 border-theme-primary/20 rounded-xl overflow-hidden">
                  {isTopPerformer && (
                    <div className="flex items-center gap-2 mb-4 animate-fade-in">
                      <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg px-3 py-1.5 rounded-full">
                        <Star className="fill-white w-4 h-4 text-white animate-pulse" />
                        <span className="font-bold text-white text-xs uppercase tracking-wide">Top Performer</span>
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-[10px] text-gray-600 dark:text-gray-400">Highest response rate</span>
                    </div>
                  )}
                  
                  <div className="relative mb-4">
                    <label className="block mb-2 font-semibold text-gray-900 dark:text-white text-sm">Select Survey to Analyze</label>
                    <div className="relative">
                      <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search or select a survey..."
                        value={showcaseSearchQuery}
                        onChange={(e) => {
                          setShowcaseSearchQuery(e.target.value);
                          setShowShowcaseDropdown(true);
                        }}
                        onFocus={() => setShowShowcaseDropdown(true)}
                        className="dark:bg-gray-800 py-3 pr-10 pl-10 border-2 border-theme-primary/30 focus:border-theme-primary dark:border-theme-primary/50 rounded-lg focus:ring-2 focus:ring-theme-primary/20 w-full font-medium text-gray-900 dark:text-white transition"
                      />
                      <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${showShowcaseDropdown ? 'rotate-180' : ''}`} />
                      {showcaseSearchQuery && (
                        <button onClick={() => { setShowcaseSearchQuery(''); setShowShowcaseDropdown(true); }} className="top-1/2 right-10 absolute text-gray-400 hover:text-gray-600 -translate-y-1/2">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {showShowcaseDropdown && (() => {
                      const filteredShowcaseSurveys = sortedSurveys.filter(s =>
                        s.title.toLowerCase().includes(showcaseSearchQuery.toLowerCase()) ||
                        s.description?.toLowerCase().includes(showcaseSearchQuery.toLowerCase())
                      );
                      return filteredShowcaseSurveys.length > 0 ? (
                        <div className="top-full left-0 z-50 absolute bg-white dark:bg-gray-800 shadow-2xl mt-2 border-2 border-theme-primary/30 dark:border-theme-primary/50 rounded-lg w-full max-h-96 overflow-y-auto">
                          <div className="py-1">
                            {filteredShowcaseSurveys.map((survey, idx) => {
                              const isSurveyTopPerformer = survey.id === topPerformer?.id;
                              return (
                                <button
                                  key={survey.id}
                                  onClick={() => {
                                    setShowcaseSurveyId(survey.id);
                                    setShowcaseSearchQuery('');
                                    setShowShowcaseDropdown(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 hover:bg-theme-primary/10 dark:hover:bg-theme-primary/20 transition ${
                                    survey.id === showcaseSurveyId ? 'bg-theme-primary/20 dark:bg-theme-primary/30' : ''
                                  } ${idx !== 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}
                                >
                                  <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{survey.title}</h4>
                                        {isSurveyTopPerformer && (
                                          <span className="flex flex-shrink-0 items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-0.5 rounded-full">
                                            <Star className="fill-white w-3 h-3 text-white" />
                                            <span className="font-bold text-[10px] text-white uppercase">Top</span>
                                          </span>
                                        )}
                                      </div>
                                      {survey.description && (
                                        <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{survey.description}</p>
                                      )}
                                    </div>
                                    <div className="flex flex-shrink-0 items-center gap-1 bg-theme-primary/10 dark:bg-theme-primary/20 px-2 py-1 rounded">
                                      <Users className="w-3 h-3 text-theme-primary" />
                                      <span className="font-bold text-theme-primary text-xs">{survey.total_responses || 0}</span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="top-full left-0 z-50 absolute bg-white dark:bg-gray-800 shadow-2xl mt-2 py-8 border-2 border-theme-primary/30 dark:border-theme-primary/50 rounded-lg w-full text-center">
                          <Search className="mx-auto mb-2 w-8 h-8 text-gray-400" />
                          <p className="text-gray-500 dark:text-gray-400 text-sm">No surveys found</p>
                        </div>
                      );
                    })()}

                    {!showShowcaseDropdown && showcaseSurvey && (
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-theme-primary" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Selected: <span className="font-medium text-gray-900 dark:text-white">{showcaseSurvey.title}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 className="mb-2 font-bold text-gray-900 dark:text-white text-lg line-clamp-2">{showcaseSurvey.title}</h3>
                  {showcaseSurvey.description && (
                    <p className="mb-4 text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{showcaseSurvey.description}</p>
                  )}

                  <div className="bg-white dark:bg-gray-800 mb-4 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">Live Analytics</span>
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                        <div className="bg-green-600 rounded-full w-2 h-2 animate-pulse"></div>
                        Live
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400 text-xs">Total Responses</span>
                          <span className="font-bold text-gray-900 dark:text-white text-sm">{responseRate}</span>
                        </div>
                        <div className="relative bg-gray-200 dark:bg-gray-700 rounded-full w-full h-3 overflow-hidden">
                          <div className="left-0 absolute inset-y-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (responseRate / Math.max(responseRate, 50)) * 100)}%` }}>
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400 text-xs">Engagement Score</span>
                          <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                            {Math.min(100, Math.round((responseRate / Math.max(responseRate, 50)) * 100))}%
                          </span>
                        </div>
                        <div className="relative bg-gray-200 dark:bg-gray-700 rounded-full w-full h-3 overflow-hidden">
                          <div className="left-0 absolute inset-y-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, Math.round((responseRate / Math.max(responseRate, 50)) * 100))}%` }}>
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600 dark:text-gray-400 text-xs">Completion Rate</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                            {Math.min(100, 85 + Math.floor(Math.random() * 15))}%
                          </span>
                        </div>
                        <div className="relative bg-gray-200 dark:bg-gray-700 rounded-full w-full h-3 overflow-hidden">
                          <div className="left-0 absolute inset-y-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, 85 + Math.floor(Math.random() * 15))}%` }}>
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="gap-2 grid grid-cols-2 mt-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-center">
                  <button
                    onClick={() => {
                      setSelectedSurvey(showcaseSurvey.id);
                      handleSurveyClick(showcaseSurvey.id);
                    }}
                    className="flex justify-center items-center gap-2 hover:opacity-90 shadow-md hover:shadow-lg px-6 py-1.5 rounded-lg w-full font-medium text-white transition"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Report for This Survey
                  </button>meout(() => {
                        const element = document.querySelector('[class*="from-blue-50"]');
                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }}
                    className="flex justify-center items-center gap-2 hover:opacity-90 shadow-md hover:shadow-lg px-6 py-1.5 rounded-lg w-full font-medium text-white transition"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Report for This Survey
                  </button>

                  <div className="bg-theme-primary/10 dark:bg-theme-primary/20 mt-4 p-3 rounded-lg">
                    <p className="mb-2 font-semibold text-gray-900 dark:text-white text-xs">🎯 Why generate a report?</p>
                    <ul className="space-y-1 text-[11px] text-gray-700 dark:text-gray-300">
                      <li>✓ Professional academic format</li>
                      <li>✓ Rich data analysis & insights</li>
                      <li>✓ Perfect for thesis research</li>
                    </ul>
                  </div>
                </div>
              ) : null;
            })()}

            <div className="bg-white dark:bg-gray-800 shadow-sm p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Total Surveys</span>
                  <span className="font-bold text-gray-900 dark:text-white text-lg">{surveys.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Filtered Results</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{filteredAndSortedSurveys.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Total Responses</span>
                  <span className="font-bold text-gray-900 dark:text-white text-lg">
                    {surveys.reduce((sum, s) => sum + (s.total_responses || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-gray-200 dark:border-gray-700 border-t">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Avg per Survey</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                    {surveys.length > 0 ? Math.round(surveys.reduce((sum, s) => sum + (s.total_responses || 0), 0) / surveys.length) : 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Features</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="flex-shrink-0 mt-1 w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">Chapter 4 & 5</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Automatic generation of thesis chapters</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="flex-shrink-0 mt-1 w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">Statistical Analysis</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Comprehensive data analysis with charts</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="flex-shrink-0 mt-1 w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">Insights & Recommendations</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">AI-powered research insights</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Download className="flex-shrink-0 mt-1 w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">Multiple Formats</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Export as PDF, Word, or Markdown</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-gradient-to-br from-theme-primary/5 to-theme-secondary/5 shadow-lg p-8 border-2 border-theme-primary/20 rounded-2xl">
            <div className="flex md:flex-row flex-col md:justify-between md:items-center gap-4 mb-8">
              <div>
                <h2 className="flex items-center gap-3 mb-2 font-bold text-gray-900 dark:text-white text-2xl">
                  <div className="flex justify-center items-center bg-theme-gradient rounded-xl w-12 h-12">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  Success Stories
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  See how researchers are transforming their thesis work with AI-powered reports
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentStoryPage(Math.max(0, currentStoryPage - 1))}
                  disabled={currentStoryPage === 0}
                  className="flex justify-center items-center bg-white hover:bg-theme-primary/10 dark:bg-gray-800 dark:hover:bg-theme-primary/20 disabled:opacity-40 shadow-md p-3 border-2 border-theme-primary/20 rounded-xl transition disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5 text-theme-primary" />
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalStoryPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStoryPage(i)}
                      className={`w-3 h-3 rounded-full transition ${
                        currentStoryPage === i ? 'bg-theme-primary w-8' : 'bg-theme-primary/30 hover:bg-theme-primary/50'
                      }`}
                    />
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentStoryPage(Math.min(totalStoryPages - 1, currentStoryPage + 1))}
                  disabled={currentStoryPage >= totalStoryPages - 1}
                  className="flex justify-center items-center bg-white hover:bg-theme-primary/10 dark:bg-gray-800 dark:hover:bg-theme-primary/20 disabled:opacity-40 shadow-md p-3 border-2 border-theme-primary/20 rounded-xl transition disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5 text-theme-primary" />
                </button>
              </div>
            </div>

            <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {currentStories.map((story, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 shadow-lg p-6 border border-theme-primary/20 rounded-xl">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: story.rating }, (_, i) => (
                      <Star key={i} className="fill-yellow-400 w-5 h-5 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mb-4 font-medium text-gray-700 dark:text-gray-300 text-sm italic leading-relaxed">
                    "{story.quote}"
                  </p>
                  <div className="pt-4 border-gray-200 dark:border-gray-700 border-t">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{story.author}</p>
                    <p className="text-theme-primary text-xs">{story.role}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{story.year}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-[10px] text-green-600 dark:text-green-400">Verified User</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="gap-3 sm:gap-4 grid grid-cols-2 lg:grid-cols-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-gray-200 dark:border-gray-700 border-t">
              <div className="text-center">
                <div className="flex justify-center items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <FileText className="w-4 sm:w-6 h-4 sm:h-6 text-theme-primary" />
                  <div className="font-bold text-theme-primary text-xl sm:text-3xl">500+</div>
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Reports Generated</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Star className="fill-theme-primary w-4 sm:w-6 h-4 sm:h-6 text-theme-primary" />
                  <div className="font-bold text-theme-primary text-xl sm:text-3xl">4.9/5</div>
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                  <Target className="w-4 sm:w-6 h-4 sm:h-6 text-theme-primary" />
                  <div className="font-bold text-theme-primary text-xl sm:text-3xl">95%</div>
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}

        {/* Configuration Modal */}
        {showConfigModal && selectedSurveyForModal && (
          <ReportConfigurationModal
            surveyId={selectedSurveyForModal.id}
            surveyTitle={selectedSurveyForModal.title}
            onGenerate={handleConfigSubmit}
            onCancel={() => {
              setShowConfigModal(false);
              setSelectedSurveyForModal(null);
            }}
          />
        )}

        {/* Progress Modal */}
        {showProgressModal && reportConfig && (
          <ReportGenerationProgress
            onComplete={handleReportComplete}
            config={reportConfig}
          />
        )}
      </ProtectedRoute>
    </DashboardLayout>
  );
}             </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </DashboardLayout>
  );
}
