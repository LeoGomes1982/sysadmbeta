import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProductsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos</CardTitle>
        <CardDescription>Gerenciamento de produtos de saúde</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Nesta página, você pode gerenciar os produtos de saúde oferecidos pelas operadoras.</p>
      </CardContent>
    </Card>
  )
}
