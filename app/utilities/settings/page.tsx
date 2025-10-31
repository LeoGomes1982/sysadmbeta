import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function SettingsPage() {
  return (
    <div className="container p-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Sistema</CardTitle>
          <CardDescription>Gerencie as configurações visuais e informações da empresa</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="theme">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="theme">Tema de Cores</TabsTrigger>
              <TabsTrigger value="logo">Logo</TabsTrigger>
              <TabsTrigger value="company">Descrição da Empresa</TabsTrigger>
            </TabsList>

            <TabsContent value="theme" className="space-y-4">
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Tema do Sistema</Label>
                  <RadioGroup defaultValue="light" className="grid grid-cols-3 gap-4 pt-2">
                    <div>
                      <RadioGroupItem value="light" id="light" className="peer sr-only" />
                      <Label
                        htmlFor="light"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-100 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <span>Claro</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                      <Label
                        htmlFor="dark"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-gray-900 p-4 hover:bg-gray-800 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <span className="text-white">Escuro</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="system" id="system" className="peer sr-only" />
                      <Label
                        htmlFor="system"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-gradient-to-r from-white to-gray-900 p-4 hover:from-gray-50 hover:to-gray-800 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <span>Sistema</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label>Cor Principal</Label>
                  <div className="grid grid-cols-6 gap-4 pt-2">
                    {["#2A3F54", "#1ABC9C", "#3498DB", "#9B59B6", "#E74C3C", "#F1C40F"].map((color) => (
                      <div
                        key={color}
                        className="h-12 rounded-md cursor-pointer border-2 hover:border-primary"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logo" className="space-y-4">
              <div className="space-y-4 pt-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <div className="mx-auto w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-gray-500">Logo Preview</span>
                  </div>
                  <Button>Carregar Logo</Button>
                </div>
                <div>
                  <Label>Tamanho Máximo</Label>
                  <Input type="text" value="2MB" readOnly className="mt-1" />
                </div>
                <div>
                  <Label>Formatos Aceitos</Label>
                  <Input type="text" value="PNG, JPG, SVG" readOnly className="mt-1" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="company" className="space-y-4">
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Nome da Empresa</Label>
                  <Input type="text" placeholder="Digite o nome da empresa" className="mt-1" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea placeholder="Digite uma breve descrição da empresa" className="mt-1" rows={4} />
                </div>
                <div>
                  <Label>Endereço</Label>
                  <Input type="text" placeholder="Digite o endereço da empresa" className="mt-1" />
                </div>
                <div>
                  <Label>Contato</Label>
                  <Input type="text" placeholder="Digite o contato principal" className="mt-1" />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 mt-6 pt-6 border-t">
            <Button variant="outline">Cancelar</Button>
            <Button>Salvar Alterações</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
