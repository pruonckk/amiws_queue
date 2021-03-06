import 'babel-polyfill'
import { mount, createLocalVue } from 'vue-test-utils'
import Vuex from 'vuex'
import Vuetify from 'vuetify'

import QueueData from '@/components/QueueData'
import * as mtype from '@/store/mutation-types'
import store from '@/store'
import Fixtures from './fixtures/QueueData'

const localVue = createLocalVue()

localVue.use(Vuex)
localVue.use(Vuetify)

describe('QueueData', () => {
  beforeEach(() => {
    store.commit(mtype.CLEAR_QUEUES_LIST)
    store.commit(mtype.SET_SELECTED_QUEUE, '')
  })

  it('shows message when not selected', () => {
    const comp = mount(QueueData, { store, localVue })
    expect(comp.contains('.members')).to.equal(false)
    expect(comp.contains('.callers')).to.equal(false)
    expect(comp.contains('.block-header')).to.equal(false)
  })

  it('change store state when close button clicked', done => {
    Fixtures.oneEmptyQueue.forEach(msg => store.dispatch('newMessage', msg))
    store.dispatch('selectedQueue', 'TechSupport')
    const comp = mount(QueueData, { store, localVue })
    expect(store.state.selectedQueue).to.equal('TechSupport')
    expect(comp.contains('.btn-close-panel')).to.equal(true)
    comp.find('.btn-close-panel').trigger('click')
    localVue.nextTick(() => {
      expect(store.state.selectedQueue).to.equal('')
      done()
    })
  })

  it('has root elements', () => {
    Fixtures.oneEmptyQueue.forEach(msg => store.dispatch('newMessage', msg))
    store.dispatch('selectedQueue', 'TechSupport')
    const comp = mount(QueueData, { store, localVue })
    expect(comp.contains('.members')).to.equal(true)
    expect(comp.contains('.callers')).to.equal(true)
  })

  it('handles queue with no callers and no members', () => {
    Fixtures.oneEmptyQueue.forEach(msg => store.dispatch('newMessage', msg))
    const comp = mount(QueueData, { store, localVue })
    expect(comp.contains('.member-card')).to.equal(false)
    expect(comp.contains('.caller-card')).to.equal(false)
  })

  it('handles queue with one member and no callers', () => {
    Fixtures.oneQueueWithOneMemeberNoCallers.forEach(msg => store.dispatch('newMessage', msg))
    store.dispatch('selectedQueue', 'TechSupport')
    const comp = mount(QueueData, { store, localVue })
    expect(comp.findAll('.member-card').length).to.equal(1)
    expect(comp.findAll('.caller-card').length).to.equal(0)
  })

  it('handles queue with one member and one caller', () => {
    Fixtures.oneQueueWithOneMemeberOneCaller.forEach(msg => store.dispatch('newMessage', msg))
    store.dispatch('selectedQueue', 'TechSupport')
    const comp = mount(QueueData, { store, localVue })
    expect(comp.findAll('.member-card').length).to.equal(1)
    expect(comp.findAll('.caller-card').length).to.equal(1)
  })

  it('updates queue member status', () => {
    Fixtures.oneQueueWithOneMemeberOneCaller.forEach(msg => store.dispatch('newMessage', msg))
    store.dispatch('newMessage', Fixtures.queueMemberStatus)
    const member = store.state.queues[0].members[0]
    expect(member.paused).to.equal(false)
    expect(member.status).to.equal(3)
    expect(member.callsTaken).to.equal(4)
    expect(member.penalty).to.equal(2)
  })

  it('update queue member on AgentConnect', () => {
    Fixtures.oneQueueWithOneMemeberOneCaller.forEach(msg => store.dispatch('newMessage', msg))
    store.dispatch('newMessage', Fixtures.agentConnect)
    const member = store.state.queues[0].members[0]
    expect(member.lastHoldtime).to.equal(2)
    expect(member.incall).to.equal(true)
  })

  it('update queue member on AgentComplete', () => {
    Fixtures.oneQueueWithOneMemeberOneCaller.forEach(msg => store.dispatch('newMessage', msg))
    store.dispatch('newMessage', Fixtures.agentComplete)
    const member = store.state.queues[0].members[0]
    expect(member.lastHoldtime).to.equal(20)
    expect(member.lastTalktime).to.equal(120)
    expect(member.incall).to.equal(false)
  })

  it('test last call taken date/time format', () => {
    Fixtures.oneQueueWithOneMemeberOneCaller.forEach(msg => store.dispatch('newMessage', msg))
    store.dispatch('selectedQueue', 'TechSupport')
    store.dispatch('newMessage', Fixtures.queueMemberStatus)
    // fix date for Travis CI timezone
    const d = new Date(1510904138000)
    const h = d.getHours()
    const p = h > 9 ? '' : '0'
    const comp = mount(QueueData, { store, localVue })
    expect(comp.find('.last-call-taken').text().trim()).to.equal(`2017-11-17 ${p}${h}:35:38`)
  })

  it('pause/unpause agent in list', () => {
    Fixtures.oneQueueWithOneMemeberOneCaller.forEach(msg => store.dispatch('newMessage', msg))
    store.dispatch('selectedQueue', 'TechSupport')
    const comp = mount(QueueData, { store, localVue })
    comp.vm.pauseAgentToggle = sinon.stub()
    comp.find('.btn-agent-toggle').trigger('click')
    expect(comp.vm.pauseAgentToggle.called).to.equal(true)
  })

  it('toggle agent paused/active', () => {
    Fixtures.oneQueueWithOneMemeberNoCallers.forEach(msg => store.dispatch('newMessage', msg))
    store.dispatch('selectedQueue', 'TechSupport')
    const comp = mount(QueueData, { store, localVue })
    comp.vm.pauseAgentInSelectedQueue = sinon.stub()
    comp.find('.btn-agent-toggle').trigger('click')
    expect(comp.vm.pauseAgentInSelectedQueue.called).to.equal(true)
    expect(comp.vm.notify).to.equal(true)
    expect(comp.vm.notifyText).to.equal('Activate agent 1004@sc360.modulis.clusterpbx.ca')
  })

  it('removes agent from queue dialog', () => {
    Fixtures.oneQueueWithOneMemeberNoCallers.forEach(msg => store.dispatch('newMessage', msg))
    store.dispatch('selectedQueue', 'TechSupport')
    const comp = mount(QueueData, { store, localVue })
    comp.find('.btn-agent-remove').trigger('click')
    expect(comp.vm.dlgBody).to.equal('Remove agent 1004@sc360.modulis.clusterpbx.ca?')
    expect(comp.vm.memberToRemove).to.equal('Local/1004@from-queue/n')
  })

  it('set member ringing when caller calls queue', () => {
    Fixtures.oneQueueWithOneMemeberNoCallers.forEach(msg => store.dispatch('newMessage', msg))
    expect(store.state.queues[0].members[0].ringing).to.equal(false)
    store.dispatch('newMessage', Fixtures.callerCallsQueue)
    expect(store.state.queues[0].members[0].ringing).to.equal(true)
  })

  it('triggers error notify on Response message', () => {
    expect(store.state.showError).to.equal(false)
    store.dispatch('newMessage', Fixtures.responseError)
    expect(store.state.showError).to.equal(true)
    expect(store.state.errorResponse).to.equal('Member not dynamic')
  })

  it('removes agent from queue dialog', () => {
    Fixtures.oneQueueWithOneMemeberNoCallers.forEach(msg => store.dispatch('newMessage', msg))
    store.dispatch('selectedQueue', 'TechSupport')
    const comp = mount(QueueData, { store, localVue })
    comp.vm.removeAgentFromQueue = sinon.stub()
    comp.find('.btn-agent-remove').trigger('click')
    comp.find('.btn-confirm-remove').trigger('click')
    expect(comp.vm.removeAgentFromQueue.called).to.equal(true)
    expect(comp.vm.notifyText).to.equal('Removing agent Local/1004@from-queue/n from queue TechSupport')
    expect(comp.vm.notify).to.equal(true)
  })
})
