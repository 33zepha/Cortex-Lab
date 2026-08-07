import { motion } from "framer-motion";
import { UserCircle } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { EmptyState } from "@/components/ui";
import { EASE_SPRING_ARRAY } from "@/lib/animations";

/**
 * Pas de système d'authentification/utilisateur en v0.1 (DECISIONS.md § non-décisions :
 * "Auth multi-utilisateurs (v0.2)"). Un profil réel viendra avec cette phase — état honnête
 * en attendant, plutôt que des données fictives.
 */
export function ProfileScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_SPRING_ARRAY }}
    >
      <PageHeader title="Profil" icon={UserCircle} />
      <EmptyState
        icon={<UserCircle className="size-6" />}
        title="Pas encore d'authentification"
        description="Cortex n'a pas de système utilisateur en v0.1 — cet écran reviendra avec l'auth multi-utilisateurs (v0.2)."
      />
    </motion.div>
  );
}
