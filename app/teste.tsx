// TestScheduling.tsx
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../src/lib/supabase';

export default function TestScheduling() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (testName: string, result: any) => {
    setTestResults(prev => [...prev, { testName, result, timestamp: new Date().toISOString() }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runAllTests = async () => {
    setIsLoading(true);
    clearResults();

    try {
      console.log('🚀 [TEST SUITE] Iniciando testes da tabela scheduling...');
      console.log('👤 [TEST SUITE] User ID:', user?.id);

      // TESTE 1: Acesso direto básico
      console.log('\n🧪 [TEST 1] Acesso direto à tabela scheduling...');
      try {
        const test1 = await supabase
          .from('scheduling')
          .select('*');
        
        addResult('TEST 1 - Acesso Direto', {
          success: true,
          data: test1.data,
          error: test1.error,
          count: test1.data?.length || 0
        });
        console.log('✅ [TEST 1] Resultado:', test1.data?.length || 0, 'registros');
      } catch (error) {
        addResult('TEST 1 - Acesso Direto', {
          success: false,
          error: error
        });
        console.error('❌ [TEST 1] Erro:', error);
      }

      // TESTE 2: Count total
      console.log('\n🧪 [TEST 2] Count total da tabela...');
      try {
        const test2 = await supabase
          .from('scheduling')
          .select('*', { count: 'exact', head: true });
        
        addResult('TEST 2 - Count Total', {
          success: true,
          count: test2.count,
          error: test2.error
        });
        console.log('✅ [TEST 2] Count:', test2.count);
      } catch (error) {
        addResult('TEST 2 - Count Total', {
          success: false,
          error: error
        });
        console.error('❌ [TEST 2] Erro:', error);
      }

      // TESTE 3: Verificar autenticação
      console.log('\n🧪 [TEST 3] Verificando autenticação...');
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        addResult('TEST 3 - Autenticação', {
          success: true,
          authUser: {
            id: authUser?.id,
            email: authUser?.email,
            role: authUser?.user_metadata?.role
          },
          contextUser: {
            id: user?.id,
            email: user?.email,
            role: user?.role
          }
        });
        console.log('✅ [TEST 3] Auth User ID:', authUser?.id);
        console.log('✅ [TEST 3] Context User ID:', user?.id);
      } catch (error) {
        addResult('TEST 3 - Autenticação', {
          success: false,
          error: error
        });
        console.error('❌ [TEST 3] Erro:', error);
      }

      // TESTE 4: Service requests do usuário
      console.log('\n🧪 [TEST 4] Service requests do usuário...');
      try {
        const test4 = await supabase
          .from('service_requests')
          .select('id, title, requester_id')
          .eq('requester_id', user?.id);
        
        addResult('TEST 4 - Service Requests', {
          success: true,
          data: test4.data,
          error: test4.error,
          count: test4.data?.length || 0
        });
        console.log('✅ [TEST 4] Service requests:', test4.data?.length || 0);
      } catch (error) {
        addResult('TEST 4 - Service Requests', {
          success: false,
          error: error
        });
        console.error('❌ [TEST 4] Erro:', error);
      }

      // TESTE 5: Scheduling com ID específico
      console.log('\n🧪 [TEST 5] Scheduling com service_request_id específico...');
      try {
        const test5 = await supabase
          .from('scheduling')
          .select('*')
          .eq('service_request_id', '850e8400-e29b-41d4-a716-446655440002');
        
        addResult('TEST 5 - ID Específico', {
          success: true,
          data: test5.data,
          error: test5.error,
          count: test5.data?.length || 0
        });
        console.log('✅ [TEST 5] Scheduling específico:', test5.data?.length || 0);
      } catch (error) {
        addResult('TEST 5 - ID Específico', {
          success: false,
          error: error
        });
        console.error('❌ [TEST 5] Erro:', error);
      }

      // TESTE 6: Scheduling com filtro IN
      console.log('\n🧪 [TEST 6] Scheduling com filtro IN...');
      try {
        const serviceRequestIds = [
          '850e8400-e29b-41d4-a716-446655440002',
          '850e8400-e29b-41d4-a716-446655440003',
          '850e8400-e29b-41d4-a716-446655440004'
        ];
        
        const test6 = await supabase
          .from('scheduling')
          .select('*')
          .in('service_request_id', serviceRequestIds);
        
        addResult('TEST 6 - Filtro IN', {
          success: true,
          data: test6.data,
          error: test6.error,
          count: test6.data?.length || 0,
          serviceRequestIds
        });
        console.log('✅ [TEST 6] Scheduling com IN:', test6.data?.length || 0);
      } catch (error) {
        addResult('TEST 6 - Filtro IN', {
          success: false,
          error: error
        });
        console.error('❌ [TEST 6] Erro:', error);
      }

      // TESTE 7: JOIN com service_requests
      console.log('\n🧪 [TEST 7] JOIN com service_requests...');
      try {
        const test7 = await supabase
          .from('scheduling')
          .select(`
            *,
            service_requests(id, title, requester_id)
          `);
        
        addResult('TEST 7 - JOIN', {
          success: true,
          data: test7.data,
          error: test7.error,
          count: test7.data?.length || 0
        });
        console.log('✅ [TEST 7] JOIN:', test7.data?.length || 0);
      } catch (error) {
        addResult('TEST 7 - JOIN', {
          success: false,
          error: error
        });
        console.error('❌ [TEST 7] Erro:', error);
      }

      // TESTE 8: JOIN com filtro do usuário
      console.log('\n🧪 [TEST 8] JOIN com filtro do usuário...');
      try {
        const test8 = await supabase
          .from('scheduling')
          .select(`
            *,
            service_requests!inner(id, title, requester_id)
          `)
          .eq('service_requests.requester_id', user?.id);
        
        addResult('TEST 8 - JOIN Filtrado', {
          success: true,
          data: test8.data,
          error: test8.error,
          count: test8.data?.length || 0
        });
        console.log('✅ [TEST 8] JOIN filtrado:', test8.data?.length || 0);
      } catch (error) {
        addResult('TEST 8 - JOIN Filtrado', {
          success: false,
          error: error
        });
        console.error('❌ [TEST 8] Erro:', error);
      }

      // TESTE 9: Query reversa
      console.log('\n🧪 [TEST 9] Query reversa (service_requests -> scheduling)...');
      try {
        const test9 = await supabase
          .from('service_requests')
          .select(`
            id,
            title,
            scheduling(*)
          `)
          .eq('requester_id', user?.id);
        
        const schedulingData = test9.data?.map(sr => sr.scheduling).flat().filter(Boolean);
        
        addResult('TEST 9 - Query Reversa', {
          success: true,
          serviceRequests: test9.data,
          schedulingData: schedulingData,
          error: test9.error,
          serviceRequestsCount: test9.data?.length || 0,
          schedulingCount: schedulingData?.length || 0
        });
        console.log('✅ [TEST 9] Query reversa - SR:', test9.data?.length, 'Scheduling:', schedulingData?.length);
      } catch (error) {
        addResult('TEST 9 - Query Reversa', {
          success: false,
          error: error
        });
        console.error('❌ [TEST 9] Erro:', error);
      }

      // TESTE 10: Verificar RLS policies
      console.log('\n🧪 [TEST 10] Verificar informações da tabela...');
      try {
        const test10 = await supabase
          .from('information_schema.tables')
          .select('*')
          .eq('table_name', 'scheduling');
        
        addResult('TEST 10 - Info Tabela', {
          success: true,
          data: test10.data,
          error: test10.error
        });
        console.log('✅ [TEST 10] Info tabela:', test10.data?.length);
      } catch (error) {
        addResult('TEST 10 - Info Tabela', {
          success: false,
          error: error
        });
        console.error('❌ [TEST 10] Erro:', error);
      }

      console.log('\n🏁 [TEST SUITE] Todos os testes concluídos!');

    } catch (globalError) {
      console.error('🚨 [TEST SUITE] Erro global:', globalError);
      addResult('ERRO GLOBAL', {
        success: false,
        error: globalError
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runBackfillResidents = async () => {
    setIsLoading(true);
    clearResults();
    try {
      console.log('🔁 [BACKFILL] Buscando agendamentos sem resident_id com service_request_id');
      const { data: scheds, error: schedsError } = await supabase
        .from('scheduling')
        .select('id, service_request_id')
        .is('resident_id', null)
        .not('service_request_id', 'is', null)
        .limit(500);

      if (schedsError) throw schedsError;
      const schedCount = scheds?.length || 0;

      const serviceRequestIds = Array.from(new Set(scheds.map((s: any) => s.service_request_id).filter(Boolean)));

      console.log('[BACKFILL] serviceRequestIds:', serviceRequestIds.length);
      const { data: srs, error: srsError } = await supabase
        .from('service_requests')
        .select('id, requester_id')
        .in('id', serviceRequestIds || []);

      if (srsError) throw srsError;
      const srMap = new Map<string, string>();
      (srs || []).forEach((sr: any) => srMap.set(sr.id, sr.requester_id));

      let updated = 0;
      const updates: Promise<any>[] = [];
      for (const s of scheds || []) {
        const requester = srMap.get(s.service_request_id);
        if (requester) {
          updates.push((async () => {
            const res = await supabase.from('scheduling').update({ resident_id: requester }).eq('id', s.id);
            if (!res.error) updated += 1;
            return res;
          })());
        }
      }

      await Promise.all(updates);

      addResult('BACKFILL Residents', { success: true, schedulingFound: schedCount, updated });
      console.log(`[BACKFILL] Completed - found=${schedCount} updated=${updated}`);
    } catch (err) {
      console.error('[BACKFILL] Error:', err);
      addResult('BACKFILL Residents', { success: false, error: err });
    } finally {
      setIsLoading(false);
    }
  };

  const renderResult = (result: any, index: number) => (
    <View key={index} style={{
      marginBottom: 16,
      padding: 12,
      borderRadius: 8,
      backgroundColor: result.result.success ? '#F0FDF4' : '#FEF2F2',
      borderWidth: 1,
      borderColor: result.result.success ? '#16A34A' : '#DC2626'
    }}>
      <Text style={{
        fontSize: 14,
        fontWeight: 'bold',
        color: result.result.success ? '#16A34A' : '#DC2626',
        marginBottom: 8
      }}>
        {result.testName} {result.result.success ? '✅' : '❌'}
      </Text>
      
      <Text style={{ fontSize: 12, color: '#374151', fontFamily: 'monospace' }}>
        {JSON.stringify(result.result, null, 2)}
      </Text>
      
      <Text style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>
        {new Date(result.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#F9FAFB' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
        🧪 Teste da Tabela Scheduling
      </Text>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={runAllTests}
          disabled={isLoading}
          style={{
            flex: 1,
            backgroundColor: isLoading ? '#9CA3AF' : '#2563EB',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            {isLoading ? 'Testando...' : 'Executar Testes'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={clearResults}
          style={{
            backgroundColor: '#6B7280',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Limpar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={runBackfillResidents}
          disabled={isLoading}
          style={{
            backgroundColor: '#10B981',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Backfill Residents
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {testResults.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 32 }}>
            Clique em "Executar Testes" para começar
          </Text>
        ) : (
          testResults.map((result, index) => renderResult(result, index))
        )}
      </ScrollView>
    </View>
  );
}