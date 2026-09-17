import {
  Ticket,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export default function StatCard({
  title,
  value,
  icon,
  color,
  bgColor,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-medium text-text-muted uppercase tracking-wide">
            {title}
          </p>
          <p className="text-[28px] font-bold text-text-dark mt-1 leading-none">
            {value}
          </p>
        </div>
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${bgColor}`}
        >
          <span className={color}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

interface StatCardsRowProps {
  stats: {
    total: number;
    open: number;
    resolved: number;
    highPriority: number;
  };
}

export function StatCardsRow({ stats }: StatCardsRowProps) {
  const cards: StatCardProps[] = [
    {
      title: "Total Tickets",
      value: stats.total,
      icon: <Ticket size={20} />,
      color: "text-primary-500",
      bgColor: "bg-primary-50",
    },
    {
      title: "Open/Active Tickets",
      value: stats.open,
      icon: <AlertCircle size={20} />,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
    },
    {
      title: "Resolved Tickets",
      value: stats.resolved,
      icon: <CheckCircle2 size={20} />,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
    },
    {
      title: "High/Critical Priority",
      value: stats.highPriority,
      icon: <AlertTriangle size={20} />,
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
