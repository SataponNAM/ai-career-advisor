"use client";
import {
  SkillGap,
  CareerRoadmap,
  SalaryRange,
  SkillInfo,
  CareerRecommendation,
} from "@/types";
import {
  TrendingUp,
  AlertCircle,
  Star,
  Clock,
  DollarSign,
  BookOpen,
  Award,
} from "lucide-react";

const importanceColors = {
  critical: "bg-red-100 text-red-700 border-red-200",
  important: "bg-yellow-100 text-yellow-700 border-yellow-200",
  "nice-to-have": "bg-green-100 text-green-700 border-green-200",
};

const levelColors = {
  beginner: "bg-gray-100 text-gray-600",
  intermediate: "bg-blue-100 text-blue-700",
  advanced: "bg-purple-100 text-purple-700",
};

// ─── Skill Tags ───────────────────────────────────────────────────────────────
export function SkillTags({ skills }: { skills: SkillInfo[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, i) => (
        <span
          key={i}
          className={`px-3 py-1 rounded-full text-xs font-medium border ${levelColors[skill.level]}`}
        >
          {skill.name}
        </span>
      ))}
    </div>
  );
}

// ─── Career Cards ─────────────────────────────────────────────────────────────
export function CareerCards({ careers }: { careers: CareerRecommendation[] }) {
  return (
    <div className="space-y-3">
      {careers.map((career, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-800">{career.title}</h4>
            {career.match_score > 0 && (
              <span className="flex items-center gap-1 text-sm font-bold text-brand-600">
                <Star size={14} fill="currentColor" />
                {career.match_score}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">{career.description}</p>
          {/* {career.required_skills?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {career.required_skills.slice(0, 5).map((s, j) => (
                <span
                  key={j}
                  className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                >
                  {s}
                </span>
              ))}
            </div>
          )} */}
        </div>
      ))}
    </div>
  );
}

// ─── Skill Gap List ───────────────────────────────────────────────────────────
export function SkillGapList({ gaps }: { gaps: SkillGap[] }) {
  return (
    <div className="space-y-2">
      {gaps.map((gap, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100"
        >
          <AlertCircle
            size={16}
            className={`mt-0.5 shrink-0 ${
              gap.importance === "critical"
                ? "text-red-500"
                : gap.importance === "important"
                  ? "text-yellow-500"
                  : "text-green-500"
            }`}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-800 text-sm">
                {gap.skill}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${importanceColors[gap.importance]}`}
              >
                {gap.importance === "critical"
                  ? "🔴 จำเป็นมาก"
                  : gap.importance === "important"
                    ? "🟡 สำคัญ"
                    : "🟢 เพิ่มเติม"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{gap.reason}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Salary Card ──────────────────────────────────────────────────────────────
// export function SalaryCard({ salary }: { salary: SalaryRange }) {
//   return (
//     <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
//       <div className="flex items-center gap-2 mb-2">
//         <DollarSign size={18} className="text-green-600" />
//         <span className="font-semibold text-green-800">เงินเดือนโดยประมาณ</span>
//       </div>
//       <p className="text-2xl font-bold text-green-700">
//         {salary.min} – {salary.max}
//         <span className="text-sm font-normal text-green-600 ml-1">
//           {salary.currency}/{salary.period}
//         </span>
//       </p>
//     </div>
//   );
// }

// ─── Roadmap Timeline ─────────────────────────────────────────────────────────
export function RoadmapTimeline({ roadmap }: { roadmap: CareerRoadmap }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock size={16} />
          <span>{roadmap.total_duration}</span>
        </div>
        {roadmap.daily_commitment && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BookOpen size={16} />
            <span>{roadmap.daily_commitment}/วัน</span>
          </div>
        )}
      </div>

      {/* Milestones */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-brand-100" />
        <div className="space-y-4">
          {roadmap.milestones?.map((milestone, i) => (
            <div key={i} className="relative pl-10">
              <div className="absolute left-2 top-3 w-4 h-4 rounded-full bg-brand-500 border-2 border-white shadow" />
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                    {milestone.week}
                  </span>
                  <h4 className="font-semibold text-gray-800 text-sm">
                    {milestone.title}
                  </h4>
                </div>
                <ul className="space-y-1 mb-3">
                  {milestone.tasks?.map((task, j) => (
                    <li
                      key={j}
                      className="text-xs text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-brand-400 mt-0.5">▸</span>
                      {task}
                    </li>
                  ))}
                </ul>
                {milestone.resources?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {milestone.resources.slice(0, 3).map((r, k) => (
                      <a
                        key={k}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-600 hover:text-brand-800 underline"
                      >
                        📚 {r.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications */}
      {/* {roadmap.key_certifications && roadmap.key_certifications.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Award size={16} /> ใบรับรองที่แนะนำ
          </h4>
          <div className="flex flex-wrap gap-2">
            {roadmap.key_certifications.map((cert, i) => (
              <div
                key={i}
                className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2"
              >
                <p className="text-xs font-medium text-yellow-800">
                  {cert.name}
                </p>
                <p className="text-xs text-yellow-600">{cert.estimated_cost}</p>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* Motivational message */}
      {/* {roadmap.motivational_message && (
        <div className="bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-100 rounded-xl p-4 text-sm text-brand-800 italic">
          💪 {roadmap.motivational_message}
        </div>
      )} */}
    </div>
  );
}
