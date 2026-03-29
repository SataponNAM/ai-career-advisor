"use client";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  TrendingUp,
  Zap,
  Star,
} from "lucide-react";

interface SkillGap {
  skill: string;
  importance: "critical" | "important" | "nice-to-have";
  reason: string;
  learn_time: string;
  free_resource?: string;
}

interface Career {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  current_coverage: number;
  match_score: number;
  description: string;
  salary_range: string;
  matched_skills: string[];
  skill_gaps: SkillGap[];
  total_upskill_time: string;
  roadmap_summary: string[];
  typical_companies: string[];
  why_recommended: string;
}

interface Props {
  careers: Career[];
  easiest_path?: string;
  highest_salary_path?: string;
  overall_advice?: string;
  detected_skills: string[];
}

const difficultyConfig = {
  easy: {
    label: "เริ่มได้เร็ว",
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    dot: "bg-green-400",
  },
  medium: {
    label: "ใช้เวลาปานกลาง",
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-200",
    dot: "bg-yellow-400",
  },
  hard: {
    label: "ต้องพัฒนาเยอะ",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-400",
  },
};

const importanceColor = {
  critical: "bg-red-100 text-red-700",
  important: "bg-yellow-100 text-yellow-700",
  "nice-to-have": "bg-gray-100 text-gray-600",
};

function CareerCard({ career, rank }: { career: Career; rank: number }) {
  const [open, setOpen] = useState(rank === 0);
  const diff = difficultyConfig[career.difficulty] || difficultyConfig.medium;
  const coverageColor =
    career.current_coverage >= 60
      ? "bg-green-400"
      : career.current_coverage >= 40
        ? "bg-yellow-400"
        : "bg-red-400";

  return (
    <div className={`border rounded-2xl overflow-hidden ${diff.bg}`}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-start gap-3 hover:bg-white/50 transition-colors text-left"
      >
        <span className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0 mt-0.5">
          {rank + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-800">{career.title}</h3>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${diff.bg} ${diff.color}`}
            >
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${diff.dot} mr-1`}
              />
              {diff.label}
            </span>
            {career.title === rank.toString() /* placeholder */ && (
              <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                ⭐ แนะนำ
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
            {career.description}
          </p>
          
          {/* Coverage bar */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500 shrink-0">
              skill ที่มีแล้ว
            </span>
            <div className="flex-1 bg-white/60 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${coverageColor}`}
                style={{ width: `${career.current_coverage}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${diff.color}`}>
              {career.current_coverage}%
            </span>
            <span className="text-xs text-gray-400">
              | ⏱ {career.total_upskill_time}
            </span>
          </div>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </button>

      {/* Detail */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/50">
          {/* Salary + companies */}
          <div className="flex flex-wrap gap-3 pt-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-700">
              <TrendingUp size={14} className="text-green-500" />
              <span className="font-medium">{career.salary_range}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {career.typical_companies?.map((c, i) => (
              <span
                key={i}
                className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600"
              >
                {c}
              </span>
            ))}
          </div>

          {/* Skills already have */}
          {career.matched_skills?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-700 mb-1.5">
                ✅ Skill ที่มีแล้ว
              </p>
              <div className="flex flex-wrap gap-1">
                {career.matched_skills.map((s, i) => (
                  <span
                    key={i}
                    className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skill gaps */}
          {career.skill_gaps?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">
                📚 Skill ที่ต้องเพิ่ม
              </p>
              <div className="space-y-2">
                {career.skill_gaps.map((gap, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-3 border border-white"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-800">
                        {gap.skill}
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${importanceColor[gap.importance] || importanceColor["nice-to-have"]}`}
                      >
                        {gap.importance}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-0.5 ml-auto">
                        <Clock size={11} /> {gap.learn_time}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{gap.reason}</p>
                    {gap.free_resource && (
                      <p className="text-xs text-brand-600 mt-1">
                        🆓 {gap.free_resource}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Roadmap summary */}
          {career.roadmap_summary?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">
                🗺 แผนภาพรวม
              </p>
              <div className="space-y-1">
                {career.roadmap_summary.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-gray-600"
                  >
                    <span className="shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 italic">
            {career.why_recommended}
          </p>
        </div>
      )}
    </div>
  );
}

export default function MultiCareerGapView({
  careers,
  easiest_path,
  highest_salary_path,
  overall_advice,
  detected_skills,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Summary banner */}
      <div className="bg-gradient-to-r from-brand-50 to-purple-50 border border-gray-400 rounded-2xl p-4">
        <p className="text-sm font-semibold text-brand-800 mb-1">
          🎯 {careers?.length || 0} อาชีพที่เหมาะสมกับ skill ของคุณ
        </p>
        <p className="text-xs text-gray-600">
          เรียงจากง่ายที่สุด → ยากที่สุด เลือกดูแต่ละอาชีพได้เลย
        </p>
        {(easiest_path || highest_salary_path) && (
          <div className="flex gap-3 mt-2 flex-wrap">
            {easiest_path && (
              <span
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                title="คลิกเพื่อดูอาชีพนี้ในรายการ"
              >
                ⚡ เริ่มง่ายสุด: {easiest_path}
              </span>
            )}
            {highest_salary_path && (
              <span
                className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full"
                title="คลิกเพื่อดูอาชีพนี้ในรายการ"
              >
                💰 เงินเดือนสูงสุด: {highest_salary_path}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Career cards */}
      <div className="space-y-3">
        {(careers || []).map((career, i) => (
          <CareerCard key={i} career={career} rank={i} />
        ))}
      </div>

      {/* Overall advice */}
      {/* {overall_advice && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-sm text-gray-700 leading-relaxed">
          💬 {overall_advice}
        </div>
      )} */}
    </div>
  );
}
