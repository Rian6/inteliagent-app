export const postalDigits = (value: string) => String(value || '').replace(/\D/g, '').slice(0, 8);
export const formatPostalCode = (value: string) => postalDigits(value).replace(/^(\d{5})(\d)/, '$1-$2');
export async function lookupPostalAddress(value: string, signal?: AbortSignal, request = fetch) {
  const cep = postalDigits(value);
  if (cep.length !== 8) throw new Error('Informe os 8 dígitos do CEP.');
  const response = await request(`https://viacep.com.br/ws/${cep}/json/`, { signal });
  if (!response.ok) throw new Error('A consulta de CEP está indisponível. Preencha o endereço ou tente novamente.');
  const result = await response.json();
  if (result.erro) throw new Error('CEP não encontrado. Confira os dígitos ou preencha o endereço manualmente.');
  return { cep, street: String(result.logradouro || ''), district: String(result.bairro || ''), city: String(result.localidade || ''), state: String(result.uf || '') };
}
