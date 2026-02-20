import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { PatientRow } from "@/hooks/usePatients";

interface FavoritePatientsCardProps {
  patients: PatientRow[];
  onToggleFavorite?: (id: string) => void;
}

export const FavoritePatientsCard = ({ patients, onToggleFavorite }: FavoritePatientsCardProps) => {
  const favoritePatients = patients.filter((p) => p.is_favorite);

  if (favoritePatients.length === 0) {
    return null;
  }

  return (
    <Card className="card-glass border-amber-200/50 bg-gradient-to-br from-amber-50/30 to-orange-50/20 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
            <h2 className="text-lg font-semibold">Pacientes Favoritos</h2>
          </div>
          <Badge variant="outline" className="text-amber-700 border-amber-300">
            {favoritePatients.length}
          </Badge>
        </div>

        <div className="space-y-2">
          {favoritePatients.slice(0, 5).map((patient) => (
            <Link
              key={patient.id}
              to={`/admin/paciente/${patient.id}`}
              className="flex items-center justify-between p-3 rounded-lg bg-card/80 hover:bg-card transition-colors border border-amber-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  {patient.name?.charAt(0) || "P"}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{patient.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {patient.phone || patient.email || "Sem contato"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onToggleFavorite && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-amber-500 hover:text-amber-600"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleFavorite(patient.id);
                    }}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </Button>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>

        {favoritePatients.length > 5 && (
          <div className="mt-3 text-center">
            <Link
              to="/admin/pacientes?filter=favoritos"
              className="text-xs text-amber-600 hover:underline"
            >
              Ver todos os {favoritePatients.length} favoritos
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
