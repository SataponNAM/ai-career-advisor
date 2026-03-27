"use client";
import { useState } from "react";
import {
  CheckCircle,
  ChevronRight,
  Loader2,
  TrendingUp,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Card } from "@radix-ui/themes";
import { requestSkillUpgrade } from "@/utils/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ReadyCareer {
  title: string;
  match_score: number;
  description: string;
  matched_skills: string[];
  missing_minor: string[];
  salary_range: string;
  why_good_fit: string;
  typical_companies: string[];
  time_to_ready: string;
}

interface NearReachCareer {
  title: string;
  current_coverage: number;
  missing_skills: Array<{
    skill: string;
    importance: string;
    learn_time: string;
  }>;
  total_upskill_time: string;
  salary_range: string;
  why_worth_it: string;
}

interface SkillUpgradePlan {
  target_career: string;
  current_coverage: number;
  gap_analysis: Array<{
    skill: string;
    current_level: string;
    required_level: string;
    importance: string;
    reason: string;
    learn_time: string;
    resources: Array<{ name: string; url: string; type: string; cost: string }>;
  }>;
  learning_roadmap: Array<{
    phase: string;
    focus: string;
    skills: string[];
    milestone: string;
  }>;
  total_time: string;
  salary_increase: string;
  motivation: string;
}

interface Props {
  readyCareers: ReadyCareer[];
  nearReachCareers: NearReachCareer[];
}

function ReadyCareerCard({ career }: { career: ReadyCareer }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor =
    career.match_score >= 85
      ? "text-green-600"
      : career.match_score >= 70
        ? "text-yellow-600"
        : "text-gray-500";

  return (
    <div className="bg-white border border-green-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <CheckCircle size={16} className="text-green-500 shrink-0" />
            <h3 className="font-bold text-gray-800">{career.title}</h3>
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
              {career.time_to_ready}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{career.description}</p>
        </div>
        <span className={`text-lg font-bold ${scoreColor} shrink-0`}>
          {career.match_score}%
        </span>
      </div>

      <div className="flex items-center gap-1.5 mt-2 text-sm text-green-700 font-medium">
        <TrendingUp size={14} />
        {career.salary_range}
      </div>

      {/* Matched skills */}
      <div className="flex flex-wrap gap-1 mt-2">
        {career.matched_skills?.slice(0, 6).map((s, i) => (
          <span
            key={i}
            className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full"
          >
            {s}
          </span>
        ))}
      </div>

      {/* Minor gaps */}
      {career.missing_minor?.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          ⚡ ต้องเพิ่มเล็กน้อย: {career.missing_minor.join(", ")}
        </p>
      )}

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          <p className="text-xs text-gray-600">{career.why_good_fit}</p>
          <div className="flex flex-wrap gap-1">
            {career.typical_companies?.map((c, i) => (
              <span
                key={i}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-brand-500 hover:text-brand-700 mt-2 flex items-center gap-1"
      >
        {expanded ? "ย่อ" : "ดูรายละเอียด"}
        <ChevronRight
          size={12}
          className={`transition-transform ${expanded ? "rotate-90" : ""}`}
        />
      </button>
    </div>
  );
}

function SkillUpgradePanel({
  career,
  onClose,
  planCache,
  setPlanCache,
}: {
  career: NearReachCareer;
  onClose: () => void;
  planCache: { [key: string]: SkillUpgradePlan };
  setPlanCache: (cache: { [key: string]: SkillUpgradePlan }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<SkillUpgradePlan | null>(null);

  const fetchPlan = async () => {
    if (planCache[career.title]) {
      setPlan(planCache[career.title]);
      return;
    }

    setLoading(true);

    try {
      const result = (await requestSkillUpgrade(career.title)) as {
        skill_upgrade_plan: SkillUpgradePlan | null;
      };

      if (result.skill_upgrade_plan) {
        setPlanCache((prev) => ({
          ...prev,
          [career.title]: result.skill_upgrade_plan!,
        }));
        setPlan(result.skill_upgrade_plan);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-[900px] max-h-[85vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">แผนพัฒนา Skill</h3>
            <p className="text-sm text-brand-600">{career.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!plan && !loading && (
            <>
              <div className="bg-brand-50 rounded-xl p-3">
                <p className="text-sm text-brand-800 font-medium mb-1">
                  ตอนนี้มี skill {career.current_coverage}% สำหรับอาชีพนี้
                </p>
                <p className="text-xs text-gray-600">
                  ต้องพัฒนาเพิ่ม ~{career.total_upskill_time} เพื่อไปถึงเป้าหมาย
                </p>
                <p className="text-xs text-green-600 mt-1">
                  💰 เงินเดือน: {career.salary_range}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">
                  Skill ที่ต้องเพิ่ม:
                </p>
                {career.missing_skills?.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs bg-gray-50 rounded-lg p-2"
                  >
                    <span className="font-medium text-gray-700">{s.skill}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded-full ${s.importance === "critical" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"}`}
                      >
                        {s.importance}
                      </span>
                      <span className="text-gray-400">{s.learn_time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* <p className="text-xs text-gray-500">{career.why_worth_it}</p> */}

              <button
                onClick={fetchPlan}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 rounded-2xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Zap size={16} />
                ดูแผนพัฒนาแบบละเอียด
              </button>
            </>
          )}

          {loading && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 size={28} className="animate-spin text-brand-500" />
              <p className="text-sm text-gray-500">กำลังสร้างแผนพัฒนา...</p>
            </div>
          )}

          {plan && (
            <div className="space-y-4">
              {/* Gap analysis */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  📚 Skill ที่ต้องเรียน
                </p>
                {plan.gap_analysis?.map((gap, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3 mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{gap.skill}</span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${gap.importance === "critical" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"}`}
                      >
                        {gap.importance}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        ⏱ {gap.learn_time}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{gap.reason}</p>
                    <div className="flex flex-wrap gap-1">
                      {gap.resources?.slice(0, 2).map((r, j) => (
                        <a
                          key={j}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-white border border-brand-200 text-brand-600 px-2 py-0.5 rounded-full hover:bg-brand-50"
                        >
                          {r.cost === "free" ? "🆓" : "💳"} {r.name}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Roadmap */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  🗺 Learning Roadmap
                </p>
                {plan.learning_roadmap?.map((phase, i) => (
                  <div key={i} className="flex gap-3 mb-3">
                    <div
                      className="w-0.5 bg-brand-200 shrink-0 mt-1"
                      style={{ minHeight: 40 }}
                    />
                    <div>
                      <p className="text-xs font-medium text-brand-700">
                        {phase.phase}
                      </p>
                      <p className="text-xs text-gray-600">{phase.focus}</p>
                      <p className="text-xs text-green-600 mt-0.5">
                        ✓ {phase.milestone}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-green-50 to-brand-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-700">
                  ⏱ เวลารวม: {plan.total_time}
                </p>
                {/* <p className="text-xs text-green-700 mt-0.5">
                  💰 {plan.salary_increase}
                </p> */}
                {/* <p className="text-xs text-gray-600 mt-1 italic">
                  {plan.motivation}
                </p> */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReadyCareersView({
  readyCareers,
  nearReachCareers,
}: Props) {
  const [selectedUpgrade, setSelectedUpgrade] =
    useState<NearReachCareer | null>(null);
  const [planCache, setPlanCache] = useState<{
    [key: string]: SkillUpgradePlan;
  }>({});

  return (
    <div className="space-y-5">
      {/* Ready careers */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={16} className="text-green-500" />
          <h3 className="font-semibold text-gray-800 text-sm">
            อาชีพที่ทำได้เลย ({readyCareers?.length || 0})
          </h3>
        </div>
        <div className="space-y-3">
          {(readyCareers || []).map((c, i) => (
            <ReadyCareerCard key={i} career={c} />
          ))}
        </div>
      </Card>

      {/* Near reach careers */}
      {nearReachCareers?.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight size={16} className="text-brand-500" />
            <h3 className="font-semibold text-gray-800 text-sm">
              อาชีพที่ทำได้ถ้าเพิ่ม skill ({nearReachCareers.length})
            </h3>
          </div>
          <div className="space-y-2">
            {nearReachCareers.map((career, i) => (
              <button
                key={i}
                onClick={() => setSelectedUpgrade(career)}
                className="w-full bg-white border border-gray-400 rounded-2xl p-4 text-left hover:border-brand-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm">
                        {career.title}
                      </span>
                      <span className="text-xs text-gray-400">
                        มี skill {career.current_coverage}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 max-w-32 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-brand-400"
                          style={{ width: `${career.current_coverage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        ⏱ {career.total_upskill_time}
                      </span>
                      <span className="text-xs text-green-600">
                        {career.salary_range}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {career.missing_skills?.slice(0, 3).map((s, j) => (
                        <span
                          key={j}
                          className={`text-xs px-1.5 py-0.5 rounded-full ${s.importance === "critical" ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-600"}`}
                        >
                          + {s.skill}
                        </span>
                      ))}
                      {(career.missing_skills?.length || 0) > 3 && (
                        <span className="text-xs text-gray-400">
                          +{career.missing_skills.length - 3} อื่น
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-gray-300 group-hover:text-brand-400 shrink-0 transition-colors"
                  />
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Skill upgrade modal */}
      {selectedUpgrade && (
        <SkillUpgradePanel
          career={selectedUpgrade}
          onClose={() => setSelectedUpgrade(null)}
          planCache={planCache}
          setPlanCache={setPlanCache}
        />
      )}
    </div>
  );
}
