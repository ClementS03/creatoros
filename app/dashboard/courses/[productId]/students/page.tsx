"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Unlock } from "lucide-react";
import Link from "next/link";

type Student = {
  email: string;
  orderId: string;
  orderCreatedAt: string;
  completedLessons: number;
  totalLessons: number;
  unlockedLessonIds: string[];
};

export default function StudentsPage() {
  const params = useParams();
  const productId = params.productId as string;
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${productId}/students`)
      .then(r => r.json())
      .then(data => { setStudents(data as Student[]); setLoading(false); });
  }, [productId]);

  async function handleUnlockAll(email: string) {
    setUnlocking(email);
    await fetch(`/api/courses/${productId}/students/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerEmail: email, lessonIds: "all" }),
    });
    setUnlocking(null);
    // Refetch to get updated state
    fetch(`/api/courses/${productId}/students`)
      .then(r => r.json())
      .then(data => setStudents(data as Student[]));
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/products/${productId}/course`}><ArrowLeft size={14} /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Students</h1>
        <span className="text-sm text-muted-foreground">({students.length})</span>
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students yet.</p>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-xs text-muted-foreground">Student</th>
                <th className="px-4 py-3 text-left font-medium text-xs text-muted-foreground">Progress</th>
                <th className="px-4 py-3 text-left font-medium text-xs text-muted-foreground">Enrolled</th>
                <th className="px-4 py-3 text-right font-medium text-xs text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map(student => (
                <tr key={student.email} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium text-sm">{student.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-1.5 max-w-24">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: student.totalLessons > 0 ? `${(student.completedLessons / student.totalLessons) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {student.completedLessons}/{student.totalLessons}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(student.orderCreatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handleUnlockAll(student.email)}
                      disabled={unlocking === student.email}
                    >
                      <Unlock size={11} className="mr-1.5" />
                      Unlock all
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
