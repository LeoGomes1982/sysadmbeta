import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FilePlus, Save, Trash2, History, XCircle, LogOut } from "lucide-react"

export default function OperatorsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Operadoras</CardTitle>
        <CardDescription>Gerenciamento de operadoras de saúde</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Aqui você pode adicionar, editar e visualizar informações sobre as operadoras de saúde.</p>
      </CardContent>
      <CardContent>
        <p>Aqui teremos o formulário de cadastramento das operadoras</p>
      </CardContent>
      <CardContent>
        <div className="container mx-auto p-4">
          <Card className="relative">
            <CardHeader>
              <CardTitle>Cadastro de Operadoras</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-8">
                {/* Commercial Information Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-primary">Informações Comerciais</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="razaoSocial">Razão Social</Label>
                      <Input id="razaoSocial" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input id="cep" placeholder="00000-000" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="endereco">Endereço</Label>
                      <Input id="endereco" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input id="bairro" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input id="cidade" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="uf">UF</Label>
                      <Input id="uf" maxLength={2} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">C.P.F.</Label>
                      <Input id="cpf" placeholder="000.000.000-00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rg">RG</Label>
                      <Input id="rg" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input id="cnpj" placeholder="00.000.000/0000-00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ccm">CCM</Label>
                      <Input id="ccm" />
                    </div>
                  </div>
                </div>

                {/* Contacts Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-primary">Contatos</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="comercial">Comercial</Label>
                      <Input id="comercial" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendas">Vendas</Label>
                      <Input id="vendas" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cadastro">Cadastro</Label>
                      <Input id="cadastro" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="financeiro">Financeiro</Label>
                      <Input id="financeiro" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="site">Site</Label>
                      <Input id="site" type="url" />
                    </div>
                  </div>
                </div>

                {/* Material Section */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-primary">Material</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="materialEndereco">Endereço</Label>
                      <Input id="materialEndereco" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="materialTelFax">Tel. / Fax</Label>
                        <Input id="materialTelFax" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="materialContato">Contato</Label>
                        <Input id="materialContato" />
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              {/* Action Buttons */}
              <div className="fixed right-4 top-20 flex flex-col gap-2">
                <Button variant="outline" size="icon" title="Nova">
                  <FilePlus className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Gravar">
                  <Save className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Limpar">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Histórico">
                  <History className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Excluir">
                  <XCircle className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Sair">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
