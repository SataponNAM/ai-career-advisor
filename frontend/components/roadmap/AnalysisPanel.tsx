"use client";
import { useState } from "react";
import { HasGoalAnalysis } from "@/types";
import {
  SkillTags,
  CareerCards,
  SkillGapList,
  RoadmapTimeline,
} from "./AnalysisCards";

import {
  User,
  Zap,
  Target,
  TrendingUp,
  Map,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "@radix-ui/themes";

interface AnalysisPanelProps {
  analysis: HasGoalAnalysis;
  sessionType: "with_goal" | "without_goal";
}

function Section({
  icon,
  title,
  children,
  defaultOpen = true,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 font-semibold text-gray-700">
          {icon}
          {title}
        </div>
        {open ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>
      {open && (
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

export default function AnalysisPanel({
  analysis,
  sessionType,
}: AnalysisPanelProps) {
  return (
    <div className="space-y-3">
      {/* Profile Summary */}
      {analysis.current_profile && (
        <Card>
          <Section icon={<User size={16} />} title="โปรไฟล์ของคุณ">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {analysis.current_profile.current_role && (
                <div>
                  <span className="text-gray-500">ตำแหน่งปัจจุบัน</span>
                  <p className="font-medium text-gray-800">
                    {analysis.current_profile.current_role}
                  </p>
                </div>
              )}

              {analysis.current_profile.years_experience !== undefined && (
                <div>
                  <span className="text-gray-500">ประสบการณ์</span>
                  <p className="font-medium text-gray-800">
                    {analysis.current_profile.years_experience} ปี
                  </p>
                </div>
              )}

              {analysis.current_profile.education && (
                <div className="col-span-2">
                  <span className="text-gray-500">การศึกษา</span>
                  <p className="font-medium text-gray-800">
                    {analysis.current_profile.education}
                  </p>
                </div>
              )}
            </div>
          </Section>
        </Card>
      )}

      {/* Skills */}
      {analysis.detected_skills?.length > 0 && (
        <Card>
          <Section
            icon={<Zap size={16} />}
            title={`ทักษะที่พบ (${analysis.detected_skills.length})`}
          >
            <SkillTags skills={analysis.detected_skills} />
          </Section>
        </Card>
      )}

      {/* Career Recommendations */}
      {analysis.recommended_careers?.length > 0 && (
        <Card>
          <Section
            icon={<Target size={16} />}
            title={
              sessionType === "without_goal" ? "อาชีพที่แนะนำ" : "เป้าหมายอาชีพ"
            }
          >
            <CareerCards careers={analysis.recommended_careers} />
          </Section>
        </Card>
      )}

      {/* Salary Range */}
      {/* {analysis.salary_range && <SalaryCard salary={analysis.salary_range} />} */}

      {/* Skill Gaps */}
      {analysis.skill_gaps?.length > 0 && (
        <Card>
          <Section
            icon={<TrendingUp size={16} />}
            title={`ทักษะที่ต้องพัฒนา (${analysis.skill_gaps.length})`}
          >
            <SkillGapList gaps={analysis.skill_gaps} />
          </Section>
        </Card>
      )}

      {/* Market Insights */}
      {analysis.market_insights?.length > 0 && (
        <Card>
          <Section
            icon={<TrendingUp size={16} />}
            title="ข้อมูลตลาดแรงงาน"
            defaultOpen={false}
          >
            <ul className="space-y-2">
              {analysis.market_insights.map((insight, i) => (
                <li
                  key={i}
                  className="text-sm text-gray-700 flex items-start gap-2"
                >
                  <span className="text-brand-500 mt-0.5 shrink-0">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </Section>
        </Card>
      )}

      {/* Roadmap */}
      {analysis.roadmap && (
        <Card>
          <Section
            icon={<Map size={16} />}
            title={`แผนพัฒนา: ${analysis.roadmap.target_role}`}
          >
            <RoadmapTimeline roadmap={analysis.roadmap} />
          </Section>
        </Card>
      )}
    </div>
  );
}
