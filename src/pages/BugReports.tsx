import { Fragment, useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { Bug, Lightbulb, Clock, Wrench, CheckCircle, ImageIcon, MoreHorizontal, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BugReportImageDialog } from "@/components/bug-reports/BugReportImageDialog";
import { useBugReports } from "@/hooks/useBugReports";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import type { BugReportStatus, BugReportType } from "@/types/bugReport";

const STATUS_ICON: Record<BugReportStatus, ReactNode> = {
  open: <Clock className="h-3.5 w-3.5" />,
  in_progress: <Wrench className="h-3.5 w-3.5" />,
  resolved: <CheckCircle className="h-3.5 w-3.5" />,
};

const STATUS_VARIANT: Record<BugReportStatus, string> = {
  open: "bg-destructive/10 text-destructive",
  in_progress: "bg-muted text-foreground",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const STATUS_LABELS: Record<BugReportStatus, string> = {
  open: "Otevřené",
  in_progress: "Rozpracované",
  resolved: "Vyřešené",
};

const ALL_STATUSES: BugReportStatus[] = ["open", "in_progress", "resolved"];

function getPathname(url: string) {
  return new URL(url, window.location.origin).pathname;
}

function parseTypeFilter(value: string): "all" | BugReportType {
  if (value === "all" || value === "bug" || value === "feature") return value;
  throw new Error(`Unsupported type filter '${value}'`);
}

function parseStatusFilter(value: string): "all" | BugReportStatus {
  if (value === "all" || value === "open" || value === "in_progress" || value === "resolved") return value;
  throw new Error(`Unsupported status filter '${value}'`);
}

export default function BugReports() {
  const { reports, updateStatus, isLoading } = useBugReports();
  const { role } = useUserRole();
  const isAdmin = role === "admin" || role === "management";
  const [typeFilter, setTypeFilter] = useState<"all" | BugReportType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | BugReportStatus>("all");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (typeFilter !== "all" && report.type !== typeFilter) return false;
      if (statusFilter !== "all" && report.status !== statusFilter) return false;
      return true;
    });
  }, [reports, typeFilter, statusFilter]);

  async function handleStatusChange(reportId: string, status: BugReportStatus) {
    setUpdatingStatusId(reportId);
    try {
      await updateStatus(reportId, status);
      toast.success("Stav hlášení byl aktualizován");
    } catch (error) {
      console.error("Failed to update bug report status:", error);
      toast.error("Stav se nepodařilo aktualizovat");
    } finally {
      setUpdatingStatusId(null);
    }
  }

  return (
    <div className="min-w-0 space-y-6 p-4 md:p-6">
      <PageHeader title="Bug reporty" titleAccent="a zpětná vazba" />

      <div className="flex flex-wrap gap-4">
        <Tabs value={typeFilter} onValueChange={(value) => setTypeFilter(parseTypeFilter(value))}>
          <TabsList className="h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="all">Vše</TabsTrigger>
            <TabsTrigger value="bug" className="gap-1">
              <Bug className="h-3.5 w-3.5" /> Chyby
            </TabsTrigger>
            <TabsTrigger value="feature" className="gap-1">
              <Lightbulb className="h-3.5 w-3.5" /> Návrhy
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(parseStatusFilter(value))}>
          <TabsList className="h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="all">Vše</TabsTrigger>
            <TabsTrigger value="open">Otevřené</TabsTrigger>
            <TabsTrigger value="in_progress">Rozpracované</TabsTrigger>
            <TabsTrigger value="resolved">Vyřešené</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-md border">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Typ</TableHead>
              <TableHead className="w-[130px]">Stav</TableHead>
              <TableHead>Předmět</TableHead>
              <TableHead className="hidden md:table-cell">Nahlásil</TableHead>
              <TableHead className="hidden lg:table-cell max-w-[220px]">Stránka</TableHead>
              <TableHead className="hidden md:table-cell w-[150px]">Vytvořeno</TableHead>
              <TableHead className="w-[70px]">Obrázek</TableHead>
              {isAdmin && <TableHead className="w-[70px]">Akce</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Načítání hlášení…
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && filteredReports.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} className="py-8 text-center text-muted-foreground">
                  Žádné záznamy
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              filteredReports.map((report) => {
                const isExpanded = expandedReportId === report.id;
                return (
                  <Fragment key={report.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => {
                        setExpandedReportId((prev) => (prev === report.id ? null : report.id));
                      }}
                    >
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={report.type === "bug" ? "border-0 bg-destructive/10 text-destructive" : "border-0 bg-primary/10 text-primary"}
                        >
                          {report.type === "bug" ? <Bug className="mr-1 h-3 w-3" /> : <Lightbulb className="mr-1 h-3 w-3" />}
                          {report.type === "bug" ? "Chyba" : "Návrh"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 border-0 ${STATUS_VARIANT[report.status]}`}>
                          {STATUS_ICON[report.status]}
                          {STATUS_LABELS[report.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium">{report.subject}</div>
                            {report.description && (
                              <div className="line-clamp-1 text-xs text-muted-foreground">
                                {report.description}
                              </div>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm md:table-cell">{report.reported_by}</TableCell>
                      <TableCell className="hidden max-w-[220px] truncate text-xs text-muted-foreground lg:table-cell">
                        {getPathname(report.page_url)}
                      </TableCell>
                      <TableCell className="hidden text-sm md:table-cell">
                        {format(new Date(report.created_at), "d. M. yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        {report.screenshot_url ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(event) => {
                              event.stopPropagation();
                              setPreviewImage(report.screenshot_url);
                            }}
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      {isAdmin && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={updatingStatusId === report.id}
                                onClick={(event) => event.stopPropagation()}
                              >
                                {updatingStatusId === report.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {ALL_STATUSES.filter((status) => status !== report.status).map((status) => (
                                <DropdownMenuItem key={status} onClick={() => void handleStatusChange(report.id, status)}>
                                  {STATUS_ICON[status]}
                                  <span className="ml-1.5">{STATUS_LABELS[status]}</span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 8 : 7} className="bg-muted/30">
                          <div className="space-y-3 py-1">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Předmět</p>
                              <p className="mt-1 text-sm">{report.subject}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Popis</p>
                              <p className="mt-1 whitespace-pre-wrap text-sm">
                                {report.description?.trim() ? report.description : "Bez popisu"}
                              </p>
                            </div>
                            <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                              <div>
                                <span className="font-medium text-foreground">Nahlásil:</span> {report.reported_by}
                              </div>
                              <div>
                                <span className="font-medium text-foreground">Vytvořeno:</span>{" "}
                                {format(new Date(report.created_at), "d. M. yyyy HH:mm")}
                              </div>
                              <div className="truncate">
                                <span className="font-medium text-foreground">Stránka:</span> {getPathname(report.page_url)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
          </TableBody>
        </Table>
      </div>

      <BugReportImageDialog
        imageUrl={previewImage}
        open={!!previewImage}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPreviewImage(null);
        }}
      />
    </div>
  );
}
