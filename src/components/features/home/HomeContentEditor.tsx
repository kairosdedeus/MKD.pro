import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Camera,
  CheckCircle2,
  Eye,
  ImagePlus,
  Info,
  LayoutTemplate,
  MapPin,
  Palette,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  defaultHomeContent,
  HomeContent,
  HomeEvent,
  HomeFixedEvent,
  HomeGallery,
  HomeGalleryItem,
  HomeHighlight,
  HomeMinistry,
  homeContentService,
} from "@/services/homeContentService";
import { cn } from "@/lib/utils";

type HomeContentEditorProps = {
  onSaved?: () => void;
};

type SectionKey =
  | "marca"
  | "banner"
  | "sobre"
  | "agenda"
  | "ministerios"
  | "galeria"
  | "contato"
  | "avancado";

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
  placeholder?: string;
  hint?: string;
};

const sections: Array<{ key: SectionKey; label: string; icon: React.ElementType }> = [
  { key: "marca", label: "Marca", icon: Palette },
  { key: "banner", label: "Banner", icon: LayoutTemplate },
  { key: "sobre", label: "Quem somos", icon: Info },
  { key: "agenda", label: "Agenda", icon: CalendarDays },
  { key: "galeria", label: "Galeria", icon: Camera },
  { key: "ministerios", label: "Ministerios", icon: UsersRound },
  { key: "contato", label: "Visita e contato", icon: MapPin },
  { key: "avancado", label: "Avancado", icon: Sparkles },
];

function Field({
  label,
  value,
  onChange,
  multiline,
  type = "text",
  placeholder,
  hint,
}: FieldProps) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="resize-none"
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {hint && <p className="text-[11px] leading-5 text-muted-foreground">{hint}</p>}
    </div>
  );
}

function EditorCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await homeContentService.uploadImage(file);
      onChange(url);
      toast({ title: "Imagem enviada" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar imagem",
        description:
          error instanceof Error
            ? error.message
            : "Confira se o bucket site-media foi criado.",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Field label={label} value={value} onChange={onChange} hint={hint} />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-2"
          disabled={uploading}
          asChild
        >
          <label>
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Enviando..." : "Enviar imagem"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </Button>
        {value && (
          <>
            <img
              src={value}
              alt={label}
              className="h-12 w-20 rounded-md object-cover ring-1 ring-border"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-destructive hover:text-destructive"
              onClick={() => onChange("")}
            >
              Remover
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function HomeContentEditor({ onSaved }: HomeContentEditorProps) {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SectionKey>("marca");
  const [content, setContent] = useState<HomeContent>(defaultHomeContent);
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [editingGallery, setEditingGallery] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    homeContentService
      .getDraft()
      .then((record) => {
        if (!mounted) return;
        setContent(record.content);
        setPublished(record.published);
        setJsonText(JSON.stringify(record.content, null, 2));
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Conteudo da Home indisponivel",
          description:
            error instanceof Error
              ? error.message
              : "Execute a migration da Home no Supabase.",
        });
        setJsonText(JSON.stringify(defaultHomeContent, null, 2));
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [toast]);

  useEffect(() => {
    setJsonText(JSON.stringify(content, null, 2));
  }, [content]);

  const canSave = useMemo(() => {
    return content.brand_name.trim() && content.hero.title.trim();
  }, [content.brand_name, content.hero.title]);

  const updateContent = (patch: Partial<HomeContent>) => {
    setDirty(true);
    setContent((current) => ({ ...current, ...patch }));
  };

  const updateHero = (patch: Partial<HomeContent["hero"]>) => {
    setDirty(true);
    setContent((current) => ({
      ...current,
      hero: { ...current.hero, ...patch },
    }));
  };

  const updateAbout = (patch: Partial<HomeContent["about"]>) => {
    setDirty(true);
    setContent((current) => ({
      ...current,
      about: { ...current.about, ...patch },
    }));
  };

  const updateVisit = (patch: Partial<HomeContent["visit"]>) => {
    setDirty(true);
    setContent((current) => ({
      ...current,
      visit: { ...current.visit, ...patch },
    }));
  };

  const updateContact = (patch: Partial<HomeContent["contact"]>) => {
    setDirty(true);
    setContent((current) => ({
      ...current,
      contact: { ...current.contact, ...patch },
    }));
  };

  const updateArrayItem = <T,>(
    key:
      | "highlights"
      | "ministries"
      | "fixed_events"
      | "special_events"
      | "galleries"
      | "photos",
    index: number,
    patch: Partial<T>,
  ) => {
    setDirty(true);
    setContent((current) => {
      const items = [...(current[key] as T[])];
      items[index] = { ...items[index], ...patch };
      return { ...current, [key]: items };
    });
  };

  const removeArrayItem = (
    key:
      | "highlights"
      | "ministries"
      | "fixed_events"
      | "special_events"
      | "galleries"
      | "photos",
    index: number,
  ) => {
    setDirty(true);
    setContent((current) => ({
      ...current,
      [key]: current[key].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const moveArrayItem = (
    key:
      | "highlights"
      | "ministries"
      | "fixed_events"
      | "special_events"
      | "galleries"
      | "photos",
    index: number,
    direction: -1 | 1,
  ) => {
    setDirty(true);
    setContent((current) => {
      const items = [...current[key]];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= items.length) return current;
      [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
      return { ...current, [key]: items };
    });
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText) as HomeContent;
      setContent(parsed);
      setDirty(true);
      toast({ title: "JSON aplicado" });
    } catch {
      toast({
        variant: "destructive",
        title: "JSON invalido",
        description: "Corrija a estrutura antes de aplicar.",
      });
    }
  };

  const uploadGalleryItems = async (
    galleryIndex: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      const uploaded = await Promise.all(
        files.slice(0, 100).map(async (file) => {
          const url = await homeContentService.uploadImage(file);
          return {
            title: file.name.replace(/\.[^/.]+$/, ""),
            url,
            type: file.type.startsWith("video/") ? "video" : "image",
          } as HomeGalleryItem;
        }),
      );

      const gallery = content.galleries[galleryIndex];
      updateArrayItem<HomeGallery>("galleries", galleryIndex, {
        items: [...gallery.items, ...uploaded],
        cover_url: gallery.cover_url || uploaded[0]?.url || "",
      });
      toast({ title: `${uploaded.length} arquivo(s) adicionados` });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar arquivos",
        description:
          error instanceof Error
            ? error.message
            : "Confira se o bucket site-media foi criado.",
      });
    } finally {
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await homeContentService.save(content, published);
      setDirty(false);
      toast({ title: "Home atualizada" });
      onSaved?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar Home",
        description:
          error instanceof Error
            ? error.message
            : "Execute a migration da Home no Supabase.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando editor...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CheckCircle2
                className={cn(
                  "h-4 w-4",
                  published ? "text-emerald-500" : "text-muted-foreground",
                )}
              />
              {published ? "Home publicada" : "Home em rascunho"}
            </p>
            <p className="text-xs text-muted-foreground">
              {dirty
                ? "Existem alteracoes nao salvas."
                : "Todas as alteracoes foram salvas."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-medium">
              <input
                type="checkbox"
                checked={published}
                onChange={(event) => {
                  setPublished(event.target.checked);
                  setDirty(true);
                }}
              />
              Publicar
            </label>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !canSave}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-muted/40 p-1">
        <div className="flex min-w-max items-center justify-center gap-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition",
                  activeSection === section.key
                    ? "bg-background text-foreground shadow-sm"
                    : "hover:bg-background/55 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-4">
          {activeSection === "marca" && (
            <EditorCard
              title="Identidade visual"
              description="Controle o nome exibido e as cores usadas em botoes, destaques e links."
            >
              <Field
                label="Nome da igreja"
                value={content.brand_name}
                placeholder="Ex: MKD Church"
                onChange={(brand_name) => updateContent({ brand_name })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Cor principal"
                  type="color"
                  value={content.primary_color}
                  onChange={(primary_color) => updateContent({ primary_color })}
                />
                <Field
                  label="Cor de destaque"
                  type="color"
                  value={content.accent_color}
                  onChange={(accent_color) => updateContent({ accent_color })}
                />
              </div>
            </EditorCard>
          )}

          {activeSection === "banner" && (
            <EditorCard
              title="Primeira dobra"
              description="O banner e a primeira impressao do visitante. Use texto curto e imagem horizontal."
            >
              <Field
                label="Chamada pequena"
                value={content.hero.eyebrow}
                placeholder="Bem-vindo a nossa casa"
                onChange={(eyebrow) => updateHero({ eyebrow })}
              />
              <Field
                label="Titulo principal"
                value={content.hero.title}
                onChange={(title) => updateHero({ title })}
                multiline
                hint="Ideal: ate 80 caracteres para caber bem no celular."
              />
              <Field
                label="Texto de apoio"
                value={content.hero.subtitle}
                onChange={(subtitle) => updateHero({ subtitle })}
                multiline
              />
              <ImageField
                label="Imagem do banner"
                value={content.hero.image_url}
                onChange={(image_url) => updateHero({ image_url })}
                hint="Recomendado: foto horizontal da igreja, culto ou comunidade."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Texto do botao principal"
                  value={content.hero.cta_label}
                  onChange={(cta_label) => updateHero({ cta_label })}
                />
                <Field
                  label="Link do botao principal"
                  value={content.hero.cta_href}
                  placeholder="#visite"
                  onChange={(cta_href) => updateHero({ cta_href })}
                />
                <Field
                  label="Texto do botao secundario"
                  value={content.hero.secondary_cta_label}
                  onChange={(secondary_cta_label) =>
                    updateHero({ secondary_cta_label })
                  }
                />
                <Field
                  label="Link do botao secundario"
                  value={content.hero.secondary_cta_href}
                  placeholder="/login"
                  onChange={(secondary_cta_href) =>
                    updateHero({ secondary_cta_href })
                  }
                />
              </div>
            </EditorCard>
          )}

          {activeSection === "sobre" && (
            <div className="space-y-4">
              <EditorCard
                title="Quem somos"
                description="Conte a historia e a identidade da igreja de forma acolhedora."
              >
                <Field
                  label="Chamada"
                  value={content.about.eyebrow}
                  onChange={(eyebrow) => updateAbout({ eyebrow })}
                />
                <Field
                  label="Titulo"
                  value={content.about.title}
                  onChange={(title) => updateAbout({ title })}
                  multiline
                />
                <Field
                  label="Descricao"
                  value={content.about.description}
                  onChange={(description) => updateAbout({ description })}
                  multiline
                />
                <ImageField
                  label="Imagem sobre"
                  value={content.about.image_url}
                  onChange={(image_url) => updateAbout({ image_url })}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Titulo da missao"
                    value={content.about.mission_title}
                    onChange={(mission_title) => updateAbout({ mission_title })}
                  />
                  <Field
                    label="Titulo da visao"
                    value={content.about.vision_title}
                    onChange={(vision_title) => updateAbout({ vision_title })}
                  />
                  <Field
                    label="Descricao da missao"
                    value={content.about.mission_description}
                    onChange={(mission_description) =>
                      updateAbout({ mission_description })
                    }
                    multiline
                  />
                  <Field
                    label="Descricao da visao"
                    value={content.about.vision_description}
                    onChange={(vision_description) =>
                      updateAbout({ vision_description })
                    }
                    multiline
                  />
                </div>
              </EditorCard>

              <EditorCard title="Destaques da igreja">
                <ArrayToolbar
                  onAdd={() =>
                    updateContent({
                      highlights: [
                        ...content.highlights,
                        {
                          title: "Novo destaque",
                          description: "Descreva este ponto.",
                        },
                      ],
                    })
                  }
                  label="Adicionar destaque"
                />
                {content.highlights.map((item, index) => (
                  <RepeaterItem
                    key={index}
                    index={index}
                    total={content.highlights.length}
                    onMove={(direction) =>
                      moveArrayItem("highlights", index, direction)
                    }
                    onRemove={() => removeArrayItem("highlights", index)}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Titulo"
                        value={item.title}
                        onChange={(title) =>
                          updateArrayItem<HomeHighlight>("highlights", index, {
                            title,
                          })
                        }
                      />
                      <Field
                        label="Descricao"
                        value={item.description}
                        onChange={(description) =>
                          updateArrayItem<HomeHighlight>("highlights", index, {
                            description,
                          })
                        }
                      />
                    </div>
                  </RepeaterItem>
                ))}
              </EditorCard>
            </div>
          )}

          {activeSection === "agenda" && (
            <Tabs defaultValue="fixos" className="w-full">
              <TabsList>
                <TabsTrigger value="fixos">Eventos fixos</TabsTrigger>
                <TabsTrigger value="eventuais">Eventos eventuais</TabsTrigger>
              </TabsList>
              <TabsContent value="fixos" className="space-y-4">
                <EditorCard
                  title="Eventos fixos"
                  description="Cultos de fim de semana, oracoes diarias, celulas e encontros recorrentes."
                >
                  <ArrayToolbar
                    onAdd={() =>
                      updateContent({
                        fixed_events: [
                          ...content.fixed_events,
                          {
                            title: "Novo evento fixo",
                            weekday: "",
                            times: "",
                            location: "",
                            description: "",
                          },
                        ],
                      })
                    }
                    label="Adicionar fixo"
                  />
                  {content.fixed_events.map((event, index) => (
                    <RepeaterItem
                      key={index}
                      index={index}
                      total={content.fixed_events.length}
                      onMove={(direction) =>
                        moveArrayItem("fixed_events", index, direction)
                      }
                      onRemove={() => removeArrayItem("fixed_events", index)}
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                          label="Titulo"
                          value={event.title}
                          onChange={(title) =>
                            updateArrayItem<HomeFixedEvent>(
                              "fixed_events",
                              index,
                              { title },
                            )
                          }
                        />
                        <Field
                          label="Dia ou frequencia"
                          value={event.weekday}
                          placeholder="Domingo ou Segunda a sexta"
                          onChange={(weekday) =>
                            updateArrayItem<HomeFixedEvent>(
                              "fixed_events",
                              index,
                              { weekday },
                            )
                          }
                        />
                        <Field
                          label="Horarios"
                          value={event.times}
                          placeholder="5h, 6h, 7h e 18h"
                          onChange={(times) =>
                            updateArrayItem<HomeFixedEvent>(
                              "fixed_events",
                              index,
                              { times },
                            )
                          }
                        />
                        <Field
                          label="Local"
                          value={event.location}
                          onChange={(location) =>
                            updateArrayItem<HomeFixedEvent>(
                              "fixed_events",
                              index,
                              { location },
                            )
                          }
                        />
                      </div>
                      <div className="mt-3">
                        <Field
                          label="Descricao"
                          value={event.description}
                          onChange={(description) =>
                            updateArrayItem<HomeFixedEvent>(
                              "fixed_events",
                              index,
                              { description },
                            )
                          }
                          multiline
                        />
                      </div>
                    </RepeaterItem>
                  ))}
                </EditorCard>
              </TabsContent>

              <TabsContent value="eventuais" className="space-y-4">
                <EditorCard
                  title="Eventos eventuais"
                  description="Use para pos culto jovem, noite de danca, conferencias e programacoes especiais."
                >
                  <ArrayToolbar
                    onAdd={() =>
                      updateContent({
                        special_events: [
                          ...content.special_events,
                          {
                            title: "Novo evento",
                            date: "",
                            time: "",
                            location: "",
                            description: "",
                            image_url: "",
                          },
                        ],
                      })
                    }
                    label="Adicionar eventual"
                  />
                  {content.special_events.map((event, index) => (
                    <RepeaterItem
                      key={index}
                      index={index}
                      total={content.special_events.length}
                      onMove={(direction) =>
                        moveArrayItem("special_events", index, direction)
                      }
                      onRemove={() => removeArrayItem("special_events", index)}
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                          label="Titulo"
                          value={event.title}
                          onChange={(title) =>
                            updateArrayItem<HomeEvent>(
                              "special_events",
                              index,
                              { title },
                            )
                          }
                        />
                        <Field
                          label="Data"
                          value={event.date}
                          placeholder="Sabado, 20 de junho"
                          onChange={(date) =>
                            updateArrayItem<HomeEvent>(
                              "special_events",
                              index,
                              { date },
                            )
                          }
                        />
                        <Field
                          label="Horario"
                          value={event.time}
                          onChange={(time) =>
                            updateArrayItem<HomeEvent>(
                              "special_events",
                              index,
                              { time },
                            )
                          }
                        />
                        <Field
                          label="Local"
                          value={event.location}
                          onChange={(location) =>
                            updateArrayItem<HomeEvent>(
                              "special_events",
                              index,
                              { location },
                            )
                          }
                        />
                      </div>
                      <div className="mt-3 space-y-3">
                        <Field
                          label="Descricao"
                          value={event.description}
                          onChange={(description) =>
                            updateArrayItem<HomeEvent>(
                              "special_events",
                              index,
                              { description },
                            )
                          }
                          multiline
                        />
                        <ImageField
                          label="Imagem do evento"
                          value={event.image_url}
                          onChange={(image_url) =>
                            updateArrayItem<HomeEvent>(
                              "special_events",
                              index,
                              { image_url },
                            )
                          }
                        />
                      </div>
                    </RepeaterItem>
                  ))}
                </EditorCard>
              </TabsContent>
            </Tabs>
          )}

          {activeSection === "ministerios" && (
            <EditorCard
              title="Ministerios"
              description="Mostre as areas de servico da igreja de forma objetiva."
            >
              <ArrayToolbar
                onAdd={() =>
                  updateContent({
                    ministries: [
                      ...content.ministries,
                      {
                        title: "Novo ministerio",
                        description: "Descreva este ministerio.",
                      },
                    ],
                  })
                }
                label="Adicionar ministerio"
              />
              {content.ministries.map((ministry, index) => (
                <RepeaterItem
                  key={index}
                  index={index}
                  total={content.ministries.length}
                  onMove={(direction) =>
                    moveArrayItem("ministries", index, direction)
                  }
                  onRemove={() => removeArrayItem("ministries", index)}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Nome"
                      value={ministry.title}
                      onChange={(title) =>
                        updateArrayItem<HomeMinistry>("ministries", index, {
                          title,
                        })
                      }
                    />
                    <Field
                      label="Descricao"
                      value={ministry.description}
                      onChange={(description) =>
                        updateArrayItem<HomeMinistry>("ministries", index, {
                          description,
                        })
                      }
                    />
                  </div>
                </RepeaterItem>
              ))}
            </EditorCard>
          )}

          {activeSection === "galeria" && (
            <EditorCard
              title={`Gerenciar Galerias (${content.galleries.length})`}
              description="Crie colecoes com capa, destaque e varias fotos. A Home exibe cards de galeria como no painel de midia."
            >
              {editingGallery === null ? (
                <>
                  <ArrayToolbar
                    onAdd={() => {
                      const nextIndex = content.galleries.length;
                      updateContent({
                        galleries: [
                          ...content.galleries,
                          {
                            title: "Nova galeria",
                            description: "",
                            cover_url: "",
                            date: "",
                            featured: false,
                            items: [],
                          },
                        ],
                      });
                      setEditingGallery(nextIndex);
                    }}
                    label="Adicionar Galeria"
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    {content.galleries.map((gallery, index) => {
                      const cover =
                        gallery.cover_url ||
                        gallery.items.find((item) => item.url)?.url ||
                        "";
                      return (
                        <article
                          key={`${gallery.title}-${index}`}
                          className="group overflow-hidden rounded-xl border border-border bg-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="relative aspect-[16/9] bg-muted">
                            {cover && (
                              <img
                                src={cover}
                                alt={gallery.title}
                                className="h-full w-full object-cover"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent opacity-80" />
                            {gallery.featured && (
                              <span className="absolute left-3 top-3 rounded-md bg-amber-500 px-2.5 py-1 text-xs font-bold text-white">
                                Destaque
                              </span>
                            )}
                            <span className="absolute right-3 top-3 rounded-md bg-black/65 px-2.5 py-1 text-xs text-white">
                              {gallery.items.length} itens
                            </span>
                            <div className="absolute inset-0 hidden items-center justify-center gap-2 bg-black/42 group-hover:flex">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => setEditingGallery(index)}
                              >
                                Editar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => removeArrayItem("galleries", index)}
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-semibold text-foreground">
                              {gallery.title}
                            </h4>
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {gallery.description || "Sem descricao"}
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              ) : (
                <GalleryEditor
                  gallery={content.galleries[editingGallery]}
                  index={editingGallery}
                  total={content.galleries.length}
                  onBack={() => setEditingGallery(null)}
                  onMove={(direction) =>
                    moveArrayItem("galleries", editingGallery, direction)
                  }
                  onRemove={() => {
                    removeArrayItem("galleries", editingGallery);
                    setEditingGallery(null);
                  }}
                  onPatch={(patch) =>
                    updateArrayItem<HomeGallery>(
                      "galleries",
                      editingGallery,
                      patch,
                    )
                  }
                  onUpload={(event) => uploadGalleryItems(editingGallery, event)}
                />
              )}
            </EditorCard>
          )}

          {activeSection === "contato" && (
            <div className="space-y-4">
              <EditorCard
                title="Primeira visita"
                description="Explique para o visitante o que fazer ao chegar."
              >
                <Field
                  label="Chamada"
                  value={content.visit.eyebrow}
                  onChange={(eyebrow) => updateVisit({ eyebrow })}
                />
                <Field
                  label="Titulo"
                  value={content.visit.title}
                  onChange={(title) => updateVisit({ title })}
                  multiline
                />
                <Field
                  label="Descricao"
                  value={content.visit.description}
                  onChange={(description) => updateVisit({ description })}
                  multiline
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Texto do botao WhatsApp"
                    value={content.visit.first_time_label}
                    onChange={(first_time_label) =>
                      updateVisit({ first_time_label })
                    }
                  />
                  <Field
                    label="Link do mapa"
                    value={content.visit.map_url}
                    placeholder="https://maps.google.com/..."
                    onChange={(map_url) => updateVisit({ map_url })}
                  />
                </div>
              </EditorCard>

              <EditorCard title="Contato e endereco">
                <Field
                  label="Endereco"
                  value={content.contact.address}
                  onChange={(address) => updateContact({ address })}
                />
                <Field
                  label="Horarios principais"
                  value={content.contact.service_times}
                  placeholder="Domingos as 19h"
                  onChange={(service_times) => updateContact({ service_times })}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="WhatsApp"
                    value={content.contact.whatsapp}
                    placeholder="https://wa.me/5565999999999"
                    onChange={(whatsapp) => updateContact({ whatsapp })}
                  />
                  <Field
                    label="Instagram"
                    value={content.contact.instagram}
                    placeholder="https://instagram.com/suaigreja"
                    onChange={(instagram) => updateContact({ instagram })}
                  />
                  <Field
                    label="Email"
                    value={content.contact.email}
                    placeholder="contato@suaigreja.com"
                    onChange={(email) => updateContact({ email })}
                  />
                </div>
              </EditorCard>
            </div>
          )}

          {activeSection === "avancado" && (
            <EditorCard
              title="JSON avancado"
              description="Use apenas quando precisar colar uma estrutura pronta. O editor visual e mais seguro para o dia a dia."
            >
              <Textarea
                value={jsonText}
                onChange={(event) => setJsonText(event.target.value)}
                rows={18}
                className="font-mono text-xs"
              />
              <Button type="button" variant="outline" onClick={applyJson}>
                Aplicar JSON
              </Button>
            </EditorCard>
          )}
        </div>

        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Eye className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Preview rapido</p>
            </div>
            <div
              className="space-y-4 p-4"
              style={
                {
                  "--preview-primary": content.primary_color,
                  "--preview-accent": content.accent_color,
                } as React.CSSProperties
              }
            >
              <div className="overflow-hidden rounded-lg bg-[#070707] text-white">
                {content.hero.image_url ? (
                  <img
                    src={content.hero.image_url}
                    alt={content.hero.title}
                    className="h-28 w-full object-cover opacity-80"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center bg-muted">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-[10px] font-semibold uppercase text-[var(--preview-accent)]">
                    {content.hero.eyebrow}
                  </p>
                  <p className="mt-2 text-base font-bold leading-tight">
                    {content.hero.title}
                  </p>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/65">
                    {content.hero.subtitle}
                  </p>
                  <div className="mt-3 h-8 rounded-md bg-[var(--preview-primary)]" />
                </div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-semibold text-foreground">
                  Estrutura atual
                </p>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>{content.fixed_events.length} evento(s) fixo(s)</p>
                  <p>{content.special_events.length} evento(s) eventual(is)</p>
                  <p>{content.ministries.length} ministerio(s)</p>
                  <p>{content.galleries.length} galeria(s)</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function GalleryEditor({
  gallery,
  index,
  total,
  onBack,
  onMove,
  onRemove,
  onPatch,
  onUpload,
}: {
  gallery: HomeGallery;
  index: number;
  total: number;
  onBack: () => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onPatch: (patch: Partial<HomeGallery>) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const removeItem = (itemIndex: number) => {
    onPatch({
      items: gallery.items.filter((_, index) => index !== itemIndex),
    });
  };

  const moveItem = (itemIndex: number, direction: -1 | 1) => {
    const nextIndex = itemIndex + direction;
    if (nextIndex < 0 || nextIndex >= gallery.items.length) return;
    const items = [...gallery.items];
    [items[itemIndex], items[nextIndex]] = [items[nextIndex], items[itemIndex]];
    onPatch({ items });
  };

  const setItemCover = (item: HomeGalleryItem) => {
    onPatch({ cover_url: item.url });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            Voltar para galerias
          </Button>
          <p className="mt-2 text-sm font-semibold text-foreground">
            Editando: {gallery.title}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onRemove}
          >
            Remover
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Titulo"
              value={gallery.title}
              onChange={(title) => onPatch({ title })}
            />
            <Field
              label="Data"
              type="date"
              value={gallery.date}
              onChange={(date) => onPatch({ date })}
            />
          </div>
          <Field
            label="Descricao"
            value={gallery.description}
            onChange={(description) => onPatch({ description })}
            multiline
          />
          <ImageField
            label="Foto de capa"
            value={gallery.cover_url}
            onChange={(cover_url) => onPatch({ cover_url })}
            hint="A capa aparece no card da Home."
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={gallery.featured}
              onChange={(event) => onPatch({ featured: event.target.checked })}
            />
            Destacar na Home
          </label>

          <div className="rounded-lg border border-border p-3">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Fotos e videos ({gallery.items.length}/100)
                </p>
                <p className="text-xs text-muted-foreground">
                  Envie arquivos e organize a ordem de exibicao.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" asChild>
                <label>
                  <Upload className="mr-2 h-4 w-4" />
                  Escolher arquivos
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={onUpload}
                  />
                </label>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {gallery.items.map((item, itemIndex) => (
                <div
                  key={`${item.url}-${itemIndex}`}
                  className="overflow-hidden rounded-lg border border-border bg-background"
                >
                  <div className="relative aspect-video bg-muted">
                    {item.type === "video" ? (
                      <video src={item.url} className="h-full w-full object-cover" />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {gallery.cover_url === item.url && (
                      <span className="absolute left-2 top-2 rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        Capa
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 p-3">
                    <Input
                      value={item.title}
                      onChange={(event) => {
                        const items = [...gallery.items];
                        items[itemIndex] = {
                          ...items[itemIndex],
                          title: event.target.value,
                        };
                        onPatch({ items });
                      }}
                    />
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => setItemCover(item)}
                      >
                        Capa
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={itemIndex === 0}
                        onClick={() => moveItem(itemIndex, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={itemIndex === gallery.items.length - 1}
                        onClick={() => moveItem(itemIndex, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeItem(itemIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <div className="relative aspect-square bg-muted">
            {gallery.cover_url && (
              <img
                src={gallery.cover_url}
                alt={gallery.title}
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            {gallery.featured && (
              <span className="absolute left-3 top-3 rounded-md bg-amber-500 px-2.5 py-1 text-xs font-bold text-white">
                Destaque
              </span>
            )}
            <span className="absolute right-3 top-3 rounded-md bg-black/65 px-2.5 py-1 text-xs text-white">
              {gallery.items.length} itens
            </span>
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <h4 className="font-bold">{gallery.title}</h4>
              <p className="mt-1 line-clamp-2 text-sm text-white/80">
                {gallery.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrayToolbar({
  onAdd,
  label,
}: {
  onAdd: () => void;
  label: string;
}) {
  return (
    <div className="flex justify-end">
      <Button type="button" size="sm" variant="outline" onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" />
        {label}
      </Button>
    </div>
  );
}

function RepeaterItem({
  index,
  total,
  onMove,
  onRemove,
  children,
}: {
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-muted-foreground">
          Item {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
