import { redirect } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { TeamStudentList } from "@/components/team-student-list";
import { getCurrentTeam } from "@/lib/auth";
import { getPortalStudents, isRegistrationOpen } from "@/lib/team-data";
import { getAllowedParticipants } from "@/lib/allowed-participants";
import { AddStudentForm } from "@/components/add-student-form";
import { updateStudentAction, deleteStudentAction } from "@/actions/student";

export default async function RegisterStudentsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const team = await getCurrentTeam();
  if (!team) {
    redirect("/team/login");
  }
  const [students, isOpen, allowedParticipants] = await Promise.all([
    getPortalStudents(),
    isRegistrationOpen(),
    getAllowedParticipants(),
  ]);
  const teamStudents = students.filter((student) => student.teamId === team.id);
  const error = typeof params?.error === "string" ? params.error : undefined;
  const success = typeof params?.success === "string" ? params.success : undefined;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Register Students</h1>
        <p className="text-sm text-white/70 mt-1">Manage your team members and their information</p>
      </div>

      {/* Messages */}
      {(error || success) && (
        <Card className={`rounded-2xl border ${error ? "border-red-500/40 bg-red-500/10" : "border-emerald-500/40 bg-emerald-500/10"} p-4`}>
          <p className={`text-sm ${error ? "text-red-300" : "text-emerald-300"}`}>
            {error ?? success}
          </p>
        </Card>
      )}

      {/* Registration Status Banner */}
      {!isOpen && (
        <Card className="rounded-2xl border-amber-500/40 bg-amber-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/20 p-2">
              <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-300">Registration Window Closed</p>
              <p className="text-xs text-amber-200/70 mt-0.5">
                You can only add, edit, or delete students when the registration window is open.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Add Student Form */}
      <Card className={`rounded-2xl border-white/10 bg-white/5 p-4 sm:p-6 text-white ${!isOpen ? 'opacity-60' : ''}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="rounded-lg bg-cyan-500/20 p-2">
            <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <CardTitle className="text-lg sm:text-xl">Add New Student</CardTitle>
        </div>
        <CardDescription className="text-white/70 mb-4">
          Chest number will be auto-generated based on your team name.
        </CardDescription>

        {isOpen ? (
          <AddStudentForm
            allowedParticipants={allowedParticipants}
            teamName={team.teamName}
            teamStudents={teamStudents}
            isOpen={isOpen}
          />
        ) : (
          <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-sm text-white/60 text-center">
              Registration window is closed. Please wait for the admin to open registration.
            </p>
          </div>
        )}
      </Card>

      {/* Students List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            Team Members ({teamStudents.length})
          </h2>
        </div>
        <TeamStudentList
          students={teamStudents}
          updateAction={updateStudentAction}
          deleteAction={deleteStudentAction}
          isRegistrationOpen={isOpen}
        />
      </div>
    </div>
  );
}

